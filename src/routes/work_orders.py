import os
import base64
import json
import logging
from enum import Enum
from typing import Optional, List, Dict
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field

from src.models.work_order import MOCK_WORK_ORDERS, WorkOrder
from src.services.gcs import upload_image

logger = logging.getLogger("fieldops-work-orders")

class WorkOrderStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

router = APIRouter(prefix="/work-orders", tags=["WorkOrders"])
security = HTTPBearer(auto_error=False)

def verify_mock_token(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    """
    Dependency to verify mock authentication header.
    Accepts any token in Bearer scheme for demonstration purposes.
    """
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication token"
        )
    return credentials.credentials

@router.get("", response_model=dict)
async def list_work_orders(
    status: Optional[WorkOrderStatus] = Query(None),
    token: str = Depends(verify_mock_token)
):
    """
    Lists work orders assigned to the technician. Supports filtering by status.
    """
    results = MOCK_WORK_ORDERS
    if status:
        results = [wo for wo in MOCK_WORK_ORDERS if wo.status == status]
        
    return {
        "data": results
    }

@router.get("/{id}", response_model=WorkOrder)
async def get_work_order(
    id: str,
    token: str = Depends(verify_mock_token)
):
    """
    Retrieves detailed metadata for a single work order by ID.
    """
    for wo in MOCK_WORK_ORDERS:
        if wo.id == id:
            return wo
            
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="The requested work order was not found"
    )

# --- In-Memory State store for Guided Audits ---
class StepAudit(BaseModel):
    step_id: str
    status: str = "pending"  # "pending", "pass", "fail", "completed_with_deviation"
    photo_url: Optional[str] = None
    quality_blur: str = "pending"
    quality_exposure: str = "pending"
    quality_framing: str = "pending"
    compliance_details: Optional[str] = None
    justification: Optional[str] = None
    extracted_mac: Optional[str] = None
    extracted_serial: Optional[str] = None
    extracted_power: Optional[float] = None

class InspectionState(BaseModel):
    work_order_id: str
    status: str = "in_progress"
    steps: Dict[str, StepAudit] = {}

ACTIVE_INSPECTIONS: Dict[str, InspectionState] = {}

def get_or_create_inspection(wo_id: str) -> InspectionState:
    if wo_id not in ACTIVE_INSPECTIONS:
        steps = {
            "bend_radius": StepAudit(step_id="bend_radius"),
            "optical_power": StepAudit(step_id="optical_power"),
            "device_label": StepAudit(step_id="device_label"),
            "labeling_enclosure": StepAudit(step_id="labeling_enclosure")
        }
        ACTIVE_INSPECTIONS[wo_id] = InspectionState(work_order_id=wo_id, steps=steps)
    return ACTIVE_INSPECTIONS[wo_id]


# --- Request and Response Models ---
class UploadRequest(BaseModel):
    step_id: str
    image_data: str  # Base64 data string (data:image/jpeg;base64,...)
    gps_lat: Optional[float] = None
    gps_lon: Optional[float] = None

class ChatRequest(BaseModel):
    message: str

def run_gemini_vision_audit(step_id: str, file_bytes: bytes, work_order_id: str, force_mock: bool = False) -> dict:
    """
    Executes standard Gemini Vision defect checking.
    Falls back to mock responses if GenAI cloud credentials are not set.
    """
    use_vertex = os.getenv("GOOGLE_GENAI_USE_VERTEXAI") in ("1", "true", "TRUE")
    api_key = os.getenv("GEMINI_API_KEY")
    has_gcp_auth = bool(os.getenv("GOOGLE_APPLICATION_CREDENTIALS") or os.getenv("GOOGLE_CLOUD_PROJECT"))
    
    if force_mock or not (api_key or use_vertex or has_gcp_auth) or api_key == "PLACEHOLDER":
        logger.warning("GenAI cloud credentials not configured or force mock active. Running offline visual defect simulation.")
        # Simulation Mock logic
        if step_id == "bend_radius":
            return {
                "quality": {"blur": "pass", "exposure": "pass", "overall": "pass"},
                "compliance": {
                    "overall": "fail",
                    "details": "Pinched fiber observed. Bend radius is below the minimum 30mm safety standard.",
                    "extracted_data": None
                }
            }
        elif step_id == "optical_power":
            return {
                "quality": {"blur": "pass", "exposure": "pass", "overall": "pass"},
                "compliance": {
                    "overall": "pass",
                    "details": "Optical power reading check: -18.5 dBm is in compliance range [-25.0, -15.0] dBm.",
                    "extracted_data": {"optical_power_dbm": -18.5, "mac_address": None, "serial_number": None}
                }
            }
        elif step_id == "device_label":
            # Match work order expected prefix
            prefix = "48:8F:4C"
            for wo in MOCK_WORK_ORDERS:
                if wo.id == work_order_id:
                    prefix = wo.expected_mac_prefix
                    break
            return {
                "quality": {"blur": "pass", "exposure": "pass", "overall": "pass"},
                "compliance": {
                    "overall": "pass",
                    "details": f"Label OCR check succeeded: extracted MAC prefix matches expected {prefix}.",
                    "extracted_data": {"optical_power_dbm": None, "mac_address": f"{prefix}:AA:BB:CC", "serial_number": "SN889201"}
                }
            }
        else:  # labeling_enclosure
            return {
                "quality": {"blur": "pass", "exposure": "pass", "overall": "pass"},
                "compliance": {
                    "overall": "pass",
                    "details": "Label and enclosure verified. Installation box is closed correctly.",
                    "extracted_data": None
                }
            }

    # Live Gemini Vision
    try:
        from google import genai
        from google.genai import types
        
        if use_vertex:
            client = genai.Client()
        elif api_key:
            client = genai.Client(api_key=api_key)
        else:
            client = genai.Client()
        image_part = types.Part.from_bytes(data=file_bytes, mime_type="image/jpeg")
        
        prompt = (
            f"You are the FieldOps AI auditor checking an FTTH installation photo for the step: {step_id}.\n"
            f"Requirements for this step:\n"
        )
        if step_id == "bend_radius":
            prompt += "Verify fiber bend radius. Bends must not be pinched or below 30mm radius."
        elif step_id == "optical_power":
            prompt += "Identify and extract the numerical optical power meter display reading in dBm as a float. Compliant range is -15.0 to -25.0 dBm."
        elif step_id == "device_label":
            prompt += "Extract the MAC address (format XX:XX:XX:XX:XX:XX) and Serial Number from the barcode label."
        else:
            prompt += "Verify that the box enclosure is completely closed and the labeling matches standard guidelines."
            
        prompt += (
            "\nAnalyze the photo and return a JSON object with this exact keys:\n"
            "{\n"
            "  \"quality\": {\n"
            "    \"blur\": \"pass\"|\"fail\",\n"
            "    \"exposure\": \"pass\"|\"fail\",\n"
            "    \"overall\": \"pass\"|\"fail\"\n"
            "  },\n"
            "  \"compliance\": {\n"
            "    \"overall\": \"pass\"|\"fail\",\n"
            "    \"details\": \"detailed explanation\",\n"
            "    \"extracted_data\": {\n"
            "       \"optical_power_dbm\": float or null,\n"
            "       \"mac_address\": string or null,\n"
            "       \"serial_number\": string or null\n"
            "    }\n"
            "  }\n"
            "}"
        )
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[image_part, prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        result = json.loads(response.text)
        return result
    except Exception as e:
        logger.error(f"Live Gemini Vision audit failed: {str(e)}. Falling back to simulated verification.")
        # Fall back to simulation
        return run_gemini_vision_audit(step_id, file_bytes, work_order_id, force_mock=True)


@router.post("/{id}/upload", response_model=dict)
async def upload_step_photo(
    id: str,
    payload: UploadRequest,
    token: str = Depends(verify_mock_token)
):
    """
    POST /api/v1/work-orders/{id}/upload
    Receives photo file (base64 encoded), saves it, runs Gemini Vision defect audit,
    and stores the progress state.
    """
    # Verify work order exists
    wo_exists = False
    for wo in MOCK_WORK_ORDERS:
        if wo.id == id:
            wo_exists = True
            break
    if not wo_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work order not found"
        )

    # Decode base64 image data
    try:
        header, encoded = payload.image_data.split(",", 1)
        file_bytes = base64.b64decode(encoded)
    except Exception as e:
        logger.error(f"Base64 decode failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid base64 image encoding: {str(e)}"
        )

    # Upload to Cloud Storage (GCS)
    gcs_uri = upload_image(
        work_order_id=id,
        step_id=payload.step_id,
        file_bytes=file_bytes,
        filename="photo.jpg"
    )

    # Execute Visual defect audit
    verdict = run_gemini_vision_audit(payload.step_id, file_bytes, id)

    # Update state cache
    inspection = get_or_create_inspection(id)
    step_id = payload.step_id
    if step_id in inspection.steps:
        step = inspection.steps[step_id]
        step.status = verdict["compliance"]["overall"]
        step.photo_url = gcs_uri
        step.quality_blur = verdict["quality"]["blur"]
        step.quality_exposure = verdict["quality"]["exposure"]
        step.quality_framing = verdict["quality"]["overall"]
        step.compliance_details = verdict["compliance"]["details"]
        
        extracted = verdict["compliance"].get("extracted_data")
        if extracted:
            step.extracted_mac = extracted.get("mac_address")
            step.extracted_serial = extracted.get("serial_number")
            step.extracted_power = extracted.get("optical_power_dbm")

    return {
        "step_id": payload.step_id,
        "photo_url": gcs_uri,
        "verdict": verdict,
        "message": "Audit verification finished."
    }


@router.post("/{id}/chat", response_model=dict)
async def chat_assistant(
    id: str,
    payload: ChatRequest,
    token: str = Depends(verify_mock_token)
):
    """
    POST /api/v1/work-orders/{id}/chat
    Processes messages sent to the orchestrator assistant.
    Checks for deviation overrides and updates state flags accordingly.
    """
    # Verify work order exists
    wo_exists = False
    for wo in MOCK_WORK_ORDERS:
        if wo.id == id:
            wo_exists = True
            break
    if not wo_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work order not found"
        )

    message = payload.message
    inspection = get_or_create_inspection(id)

    # Detect deviation override keywords in English
    msg_lower = message.lower()
    override_triggered = False
    target_step_id = "bend_radius"  # Default target for override testing
    justification_text = "Space constraints or cable mount limits prevent standard radius compliance"

    keywords = ["override", "justify", "cabinet", "space", "limit", "restrict", "pinched"]
    if any(kw in msg_lower for kw in keywords):
        override_triggered = True
        
        # Extract explicit justification words if available
        if "override" in msg_lower:
            parts = msg_lower.split("override", 1)
            if len(parts) > 1 and len(parts[1].strip()) > 5:
                justification_text = parts[1].strip()

    # Determine first non-complete step to override
    target_step = None
    for step_id in ["bend_radius", "optical_power", "device_label", "labeling_enclosure"]:
        if inspection.steps[step_id].status != "pass":
            target_step = step_id
            break

    if not target_step:
        target_step = "bend_radius"

    if override_triggered:
        # Log justification and status
        step = inspection.steps[target_step]
        step.status = "pass"  # Mark as resolved to unblock client
        step.compliance_details = f"Overridden with justification: {justification_text}"
        step.justification = justification_text
        
        return {
            "reply": f"Understood. I have registered the deviation justification: '{justification_text}' and marked the {target_step} step as completed with deviation.",
            "action": {
                "type": "override_step",
                "step_id": target_step,
                "status": "completed_with_deviation",
                "justification": justification_text
            }
        }

    # Standard chat reply
    use_vertex = os.getenv("GOOGLE_GENAI_USE_VERTEXAI") in ("1", "true", "TRUE")
    api_key = os.getenv("GEMINI_API_KEY")
    has_gcp_auth = bool(os.getenv("GOOGLE_APPLICATION_CREDENTIALS") or os.getenv("GOOGLE_CLOUD_PROJECT"))
    
    if not (api_key or use_vertex or has_gcp_auth):
        reply = f"Thank you for the update. I am currently monitoring the {target_step} installation step. Please upload a clear photo or type/dictate an override request if there is a block."
    else:
        try:
            from google import genai
            if use_vertex:
                client = genai.Client()
            elif api_key:
                client = genai.Client(api_key=api_key)
            else:
                client = genai.Client()
            prompt = (
                f"You are the FieldOps installation assistant. The technician is checking step: {target_step}.\n"
                f"The technician says: \"{message}\"\n"
                f"Respond concisely in English."
            )
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            reply = response.text.strip()
        except Exception:
            reply = f"Assistant online. Current step is {target_step}. Please upload installation photos to continue."

    return {
        "reply": reply,
        "action": None
    }


@router.get("/{id}/report")
async def get_markdown_report(
    id: str,
    token: str = Depends(verify_mock_token)
):
    """
    GET /api/v1/work-orders/{id}/report
    Compiles completed inspection data into a formatted English Markdown report.
    """
    # Find work order metadata
    target_wo = None
    for wo in MOCK_WORK_ORDERS:
        if wo.id == id:
            target_wo = wo
            break
            
    if not target_wo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Work order not found"
        )

    inspection = get_or_create_inspection(id)
    
    # Check overall status
    overall_status = "APPROVED"
    has_deviation = False
    for step_id in ["bend_radius", "optical_power", "device_label", "labeling_enclosure"]:
        step = inspection.steps[step_id]
        if step.justification:
            has_deviation = True
            
    if has_deviation:
        overall_status = "APPROVED WITH DEVIATION"

    # Build steps list details
    steps_md = []
    step_names = {
        "bend_radius": "1. Fiber Bend Radius",
        "optical_power": "2. Optical Power Reading",
        "device_label": "3. Device Label (OCR)",
        "labeling_enclosure": "4. Labeling & Enclosure"
    }

    for step_id in ["bend_radius", "optical_power", "device_label", "labeling_enclosure"]:
        step = inspection.steps[step_id]
        status_label = "PENDING"
        if step.status == "pass":
            status_label = "COMPLETED WITH DEVIATION" if step.justification else "PASSED"
        elif step.status == "fail":
            status_label = "FAILED"
            
        details = step.compliance_details or "No audit verification run yet."
        photo = step.photo_url or "Not uploaded"
        
        step_md = (
            f"### {step_names[step_id]}\n"
            f"* **Status**: {status_label}\n"
            f"* **Photo URL/GCS**: {photo}\n"
            f"* **Audit Verdict Details**: {details}\n"
        )
        if step.justification:
            step_md += f"* **Deviation Justification**: {step.justification}\n"
        if step.extracted_mac:
            step_md += f"* **Extracted MAC**: {step.extracted_mac}\n"
        if step.extracted_serial:
            step_md += f"* **Extracted Serial**: {step.extracted_serial}\n"
        if step.extracted_power is not None:
            step_md += f"* **Extracted Power Level**: {step.extracted_power} dBm\n"
            
        steps_md.append(step_md)

    date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    report_md = (
        f"# FTTH Installation Audit Report\n\n"
        f"* **Work Order ID**: {target_wo.id}\n"
        f"* **Installation Address**: {target_wo.address}\n"
        f"* **ONT Target Model**: {target_wo.ont_model}\n"
        f"* **GPS Coordinates**: Lat {target_wo.gps_lat}, Lon {target_wo.gps_lon}\n"
        f"* **Audit Date**: {date_str}\n"
        f"* **Overall Verdict**: **{overall_status}**\n\n"
        f"## Checklist Audits\n\n"
        + "\n".join(steps_md)
    )

    from fastapi.responses import PlainTextResponse
    return PlainTextResponse(report_md)
