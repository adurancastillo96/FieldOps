import os
import json
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from pydantic import BaseModel, Field, ValidationError
from src.routes.work_orders import verify_mock_token

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
    Validates payload JSON and stores uploaded images locally.
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
        # Read a small chunk to ensure file size is populated if not set
        file.file.seek(0, os.SEEK_END)
        file_size = file.file.tell()
        file.file.seek(0)  # Reset pointer
        total_size += file_size
        
    if total_size > 20 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sync payload size exceeds 20MB limit"
        )

    # 3. Save uploaded evidence files to uploads directory
    valid_step_ids = {step.step_id for step in sync_data.steps}
    
    for file in files:
        # Extract step_id from the file name base (e.g. "site-overview.jpg" -> "site-overview")
        step_id = os.path.splitext(file.filename)[0]
        if step_id not in valid_step_ids:
            # Fallback: if filename doesn't match step_id, skip or log
            continue
            
        dest_dir = os.path.join("uploads", sync_data.work_order_id, step_id)
        os.makedirs(dest_dir, exist_ok=True)
        dest_path = os.path.join(dest_dir, file.filename)
        
        try:
            with open(dest_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to write file to disk: {str(e)}"
            )

    # 4. Run compliance checks for final verdict response
    verdict = "approved"
    details = "All quality and compliance gates passed successfully."
    
    for step in sync_data.steps:
        # Quality failure check
        if step.quality_blur == "fail" or step.quality_exposure == "fail" or step.quality_framing == "fail":
            verdict = "rejected"
            details = f"Inspection rejected: Quality check failed on step {step.step_id}."
            break
            
        # Optical power check range check (-28.0 to -8.0 dBm)
        if step.step_id == "power-meter" and step.optical_power_dbm is not None:
            power = step.optical_power_dbm
            if power < -28.0 or power > -8.0:
                verdict = "rejected"
                details = f"Inspection rejected: Optical power of {power} dBm is out of compliance range [-28.0, -8.0]."
                break

    return {
        "status": "synced",
        "inspection_id": sync_data.id,
        "verdict": verdict,
        "details": details
    }
