import os
from google.adk.agents import LlmAgent
from src.agents.tools import display_validation_result

photo_auditor = LlmAgent(
    name="photo_auditor",
    model=os.getenv("STANDARD_AGENT_MODEL", "gemini-2.5-flash"),
    description="Specialist agent that audits inspection photo quality (blur, exposure, framing).",
    instruction=(
        "You are the Photo Quality Auditor for FieldOps.\n"
        "Your task is to analyze captured photos of FTTH ONT installations.\n"
        "1. Check if the image is blurry, underexposed, or overexposed.\n"
        "2. Ensure the ONT, cable, or label is centered and within the frame.\n"
        "If quality is poor, alert the technician to retake the photo using tool calls or voice.\n"
        "Always respond with a clear verdict."
    ),
    tools=[display_validation_result]
)
