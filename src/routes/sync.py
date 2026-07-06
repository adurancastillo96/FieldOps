import os
import json
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from pydantic import BaseModel, Field, ValidationError

from src.routes.work_orders import verify_mock_token
from src.services.gcs import upload_image
from src.services.bigquery import insert_inspection_ledger

router = APIRouter(prefix="/sync", tags=["Synchronization"])

class SyncStep(BaseModel):
    step_id: str = Field(..., description="ID of the inspection step")
    evidence_type: str = Field(..., description="Type of evidence: photo or reading")
    ocr_value: Optional[str] = Field(None, description="OCR text extracted on edge")
    optical_power_dbm: Optional[float] = Field(None, description="Optical power reading if applicable")
    quality_blur: str = Field(..., description="Local blur check: pass or fail")
    quality_exposure: str = Field(..., description="Local exposure check: pass or fail")
    quality_framing: str = Field(..., description="Local framing check: pass or fail")

class SyncPayload(BaseModel):
    id: str = Field(..., description="Unique inspection UUID")
    work_order_id: str = Field(..., description="Associated work order UUID")
    technician_id: str = Field(..., description="Technician identifier")
    gps_lat: Optional[float] = Field(None, description="GPS Latitude")
    gps_lon: Optional[float] = Field(None, description="GPS Longitude")
    steps: List[SyncStep] = Field(..., description="List of completed steps")

@router.post("", response_model=dict)
async def sync_inspection(
    payload: str = Form(..., description="Stringified JSON metadata of the inspection"),
    files: List[UploadFile] = File(default=[]),
    token: str = Depends(verify_mock_token)
):
    """
    Handles synchronization of offline-captured inspections.
    Validates payload JSON, uploads images to GCS, and ledgers in BigQuery.
    """
    # 1. Parse and validate JSON payload against Pydantic schema
    try:
        data = json.loads(payload)
        sync_data = SyncPayload(**data)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payload JSON format"
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Validation failed: {e.errors()}"
        )

    # 2. Assert file size constraints (Max 20MB total)
    total_size = 0
    for file in files:
        file.file.seek(0, os.SEEK_END)
        file_size = file.file.tell()
        file.file.seek(0)
        total_size += file_size
        
    if total_size > 20 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sync payload size exceeds 20MB limit"
        )

    # 3. Process and upload files to Cloud Storage (GCS)
    valid_step_ids = {step.step_id for step in sync_data.steps}
    uploaded_gcs_paths = {}
    
    for file in files:
        step_id = os.path.splitext(file.filename)[0]
        if step_id not in valid_step_ids:
            continue
            
        # Read file bytes for uploading
        file_bytes = await file.read()
        
        # Upload using GCS service
        gcs_uri = upload_image(
            work_order_id=sync_data.work_order_id,
            step_id=step_id,
            file_bytes=file_bytes,
            filename=file.filename
        )
        uploaded_gcs_paths[step_id] = gcs_uri

    # 4. Run compliance checks for final verdict response
    verdict = "approved"
    details = "All quality and compliance gates passed successfully."
    
    for step in sync_data.steps:
        if step.quality_blur == "fail" or step.quality_exposure == "fail" or step.quality_framing == "fail":
            verdict = "rejected"
            details = f"Inspection rejected: Quality check failed on step {step.step_id}."
            break
            
        if step.step_id == "power-meter" and step.optical_power_dbm is not None:
            power = step.optical_power_dbm
            if power < -28.0 or power > -8.0:
                verdict = "rejected"
                details = f"Inspection rejected: Optical power of {power} dBm is out of compliance range [-28.0, -8.0]."
                break

    # 5. Build final structured audit data and ingest in BigQuery
    steps_payload = []
    for step in sync_data.steps:
        steps_payload.append({
            "step_id": step.step_id,
            "evidence_type": step.evidence_type,
            "ocr_value": step.ocr_value,
            "optical_power_dbm": step.optical_power_dbm,
            "quality_blur": step.quality_blur,
            "quality_exposure": step.quality_exposure,
            "quality_framing": step.quality_framing,
            "image_gcs_uri": uploaded_gcs_paths.get(step.step_id)
        })
        
    inspection_record = {
        "id": sync_data.id,
        "work_order_id": sync_data.work_order_id,
        "technician_id": sync_data.technician_id,
        "gps_lat": sync_data.gps_lat,
        "gps_lon": sync_data.gps_lon,
        "overall_verdict": verdict,
        "details": details,
        "steps": steps_payload
    }
    
    # Ingest record in BQ
    insert_inspection_ledger(inspection_record)

    return {
        "status": "synced",
        "inspection_id": sync_data.id,
        "verdict": verdict,
        "details": details
    }
