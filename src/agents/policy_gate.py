import json
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator, model_validator

class StepAudit(BaseModel):
    step_id: str = Field(..., description="Step identification code")
    evidence_type: str = Field(..., description="Type: photo or reading")
    ocr_value: Optional[str] = Field(None, description="MAC/Serial value")
    optical_power_dbm: Optional[float] = Field(None, description="Optical power measurement in dBm")
    quality_blur: str = Field(..., description="Blur QA check: pass or fail")
    quality_exposure: str = Field(..., description="Exposure QA check: pass or fail")
    quality_framing: str = Field(..., description="Framing QA check: pass or fail")
    compliance_verdict: str = Field(..., description="Compliance status: pass or fail")
    compliance_justification: Optional[str] = Field(None, description="Compliance explanation reason")

    @field_validator("quality_blur", "quality_exposure", "quality_framing", "compliance_verdict")
    @classmethod
    def validate_enum_fields(cls, v: str) -> str:
        clean_v = v.lower().strip()
        if clean_v not in ("pass", "fail"):
            raise ValueError(f"Value must be either 'pass' or 'fail', got '{v}'")
        return clean_v

class InspectionAudit(BaseModel):
    id: str = Field(..., description="Unique inspection UUID")
    work_order_id: str = Field(..., description="Associated work order UUID")
    technician_id: str = Field(..., description="Technician ID")
    gps_lat: Optional[float] = Field(None, description="GPS Latitude")
    gps_lon: Optional[float] = Field(None, description="GPS Longitude")
    steps: List[StepAudit] = Field(..., description="List of inspection steps")
    overall_verdict: str = Field(..., description="Final audit status: approved, rejected, or review_required")

    @field_validator("overall_verdict")
    @classmethod
    def validate_overall_verdict(cls, v: str) -> str:
        clean_v = v.lower().strip()
        if clean_v not in ("approved", "rejected", "review_required"):
            raise ValueError(f"Verdict must be 'approved', 'rejected', or 'review_required', got '{v}'")
        return clean_v

    @model_validator(mode="after")
    def check_logical_consistency(self) -> 'InspectionAudit':
        # Enforce consistency rules
        has_quality_failures = False
        power_out_of_bounds = False
        
        for step in self.steps:
            if step.quality_blur == "fail" or step.quality_exposure == "fail" or step.quality_framing == "fail":
                has_quality_failures = True
            if step.step_id == "power-meter" and step.optical_power_dbm is not None:
                power = step.optical_power_dbm
                if power < -28.0 or power > -8.0:
                    power_out_of_bounds = True

        if self.overall_verdict == "approved":
            if has_quality_failures:
                raise ValueError("An inspection cannot be approved when step quality checks are failing.")
            if power_out_of_bounds:
                raise ValueError("An inspection cannot be approved when optical power levels are out of compliance range [-28.0, -8.0].")
                
        return self

def validate_inspection_report(payload_dict: dict) -> dict:
    """
    Deterministic safety policy gate checker (pure Python).
    Returns a dictionary indicating validity, parsed data, and errors.
    """
    try:
        parsed_audit = InspectionAudit(**payload_dict)
        return {
            "valid": True,
            "data": parsed_audit.model_dump(),
            "errors": None
        }
    except Exception as e:
        return {
            "valid": False,
            "data": None,
            "errors": str(e)
        }

async def run_self_correction_loop(agent_runner, initial_payload: dict, max_attempts: int = 3) -> dict:
    """
    Coordinates LLM self-correction loops when policy gates fail.
    Instructs the agent runner to correct mistakes up to max_attempts times.
    """
    current_payload = initial_payload
    
    for attempt in range(1, max_attempts + 1):
        result = validate_inspection_report(current_payload)
        if result["valid"]:
            return {
                "success": True,
                "data": result["data"],
                "attempts": attempt
            }
            
        # If invalid, generate a retry prompt with validation stack details
        error_msg = result["errors"]
        retry_prompt = (
            f"AUDIT GATE FAILURE (Attempt {attempt}/{max_attempts}):\n"
            f"The final inspection report failed validation rules with error details:\n"
            f"  {error_msg}\n\n"
            f"Please revise the payload fields (correct logical contradictions, check bounds) and return a corrected JSON payload."
        )
        
        if attempt == max_attempts:
            break
            
        # Call agent to correct itself (emulated via runner or agent call)
        try:
            response = await agent_runner.generate_correction(retry_prompt)
            current_payload = json.loads(response)
        except Exception:
            # Fallback if parsing or execution fails
            break
            
    return {
        "success": False,
        "errors": f"Policy gate failed after {max_attempts} correction attempts.",
        "data": None
    }
