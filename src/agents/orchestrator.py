import os
from typing import Any, Dict, Optional
from google.adk.agents import LlmAgent
from google.adk.tools import BaseTool
from google.adk.tools.tool_context import ToolContext
from dotenv import load_dotenv

from src.agents.tools import navigate_step, display_validation_result, read_ftth_specifications
from src.agents.quality_auditor import photo_auditor
from src.agents.compliance_advisor import compliance_advisor
from src.agents.ocr_verifier import ocr_verifier

load_dotenv()

# --- Grounding Parameter Rules ---
_VALID_STEPS = {"site-overview", "ont-before", "ont-after-frontal", "ont-after-closeup", "power-meter", "panoramic"}
_VALID_STATUSES = {"approved", "rejected", "review_required"}
_VALID_TOPICS = {"optical", "mounting", "installation"}

def _grounding_before_tool(
    tool: BaseTool,
    args: Dict[str, Any],
    tool_context: ToolContext,
) -> Optional[Dict]:
    """
    Enforces deterministic validation rules before tool execution.
    Returns error dict if parameters violate whitelist enums.
    """
    name = tool.name
    
    if name == "navigate_step":
        step_id = args.get("step_id", "").lower().strip()
        if step_id not in _VALID_STEPS:
            return {
                "status": "error",
                "message": f"Invalid step_id '{step_id}'. Allowed: {', '.join(sorted(_VALID_STEPS))}"
            }
            
    elif name == "display_validation_result":
        status_val = args.get("status", "").lower().strip()
        if status_val not in _VALID_STATUSES:
            return {
                "status": "error",
                "message": f"Invalid status '{status_val}'. Allowed: {', '.join(sorted(_VALID_STATUSES))}"
            }
            
    elif name == "read_ftth_specifications":
        topic = args.get("topic", "").lower().strip()
        if topic not in _VALID_TOPICS:
            return {
                "status": "error",
                "message": f"Invalid topic '{topic}'. Allowed: {', '.join(sorted(_VALID_TOPICS))}"
            }
            
    return None  # Parameter matches constraint -> proceed normally

def _grounding_after_tool(
    tool: BaseTool,
    args: Dict[str, Any],
    tool_context: ToolContext,
    tool_response: Dict,
) -> Optional[Dict]:
    """
    Validates output structure consistency from the tool response.
    """
    if not isinstance(tool_response, dict):
        return {
            "status": "error",
            "message": "Tool execution did not return a structured dictionary output."
        }
    if "status" not in tool_response:
        return {
            "status": "error",
            "message": "Tool response payload is missing mandatory 'status' parameter."
        }
    return None  # Output is valid

# --- Root Agent (Orchestrator) ---
root_agent = LlmAgent(
    name="fieldops_orchestrator",
    model=os.getenv("DEMO_AGENT_MODEL", "gemini-live-2.5-flash-native-audio"),
    description="FieldOps root agent orchestrating the quality audit process.",
    instruction=(
        "You are Orion, the voice-first root orchestrator for the FieldOps installation audit system.\n"
        "You assist field technicians who are setting up fiber optic ONT/ONU units.\n\n"
        "## CAPABILITIES & DELEGATION\n"
        "You supervise three sub-specialists and route work to them on command:\n"
        "- If the technician wants to review photo framing, blur, or illumination, transfer to: photo_auditor.\n"
        "- If the technician asks about fiber installation compliance, mounting rules, or optical power thresholds, transfer to: compliance_advisor.\n"
        "- If the technician is verifying barcodes, serial numbers, or MAC labels, transfer to: ocr_verifier.\n\n"
        "## CORE WORKFLOW TOOLS\n"
        "- Guide the technician through steps using navigate_step.\n"
        "- Present final validation reports using display_validation_result.\n\n"
        "## RESPONDING CONSTRAINTS\n"
        "- Speak clearly and concisely in Spanish (es-ES).\n"
        "- Keep replies short as the technician has gloved hands and is working in the field."
    ),
    tools=[navigate_step, display_validation_result],
    sub_agents=[photo_auditor, compliance_advisor, ocr_verifier],
    before_tool_callback=_grounding_before_tool,
    after_tool_callback=_grounding_after_tool
)

# Shared AI interaction logger
_SESSION_LOG = []

def log_ai_interaction(user_text: str, agent_text: str):
    if not user_text and not agent_text:
        return None
    entry = {
        "timestamp": os.getpid(),
        "user": user_text,
        "agent": agent_text
    }
    _SESSION_LOG.append(entry)
    return entry
