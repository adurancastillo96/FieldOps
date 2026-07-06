import os
from google.adk.agents import LlmAgent
from src.agents.tools import verify_mac_prefix, display_validation_result

ocr_verifier = LlmAgent(
    name="ocr_verifier",
    model=os.getenv("STANDARD_AGENT_MODEL", "gemini-2.5-flash"),
    description="Specialist agent that validates device label OCR extractions against vendor specs.",
    instruction=(
        "You are the OCR verification specialist for FieldOps.\n"
        "Your task is to review OCR-extracted MAC addresses and serial numbers from ONT label photos.\n"
        "1. Check if the prefix of the MAC address matches the expected OUI prefix using verify_mac_prefix.\n"
        "2. Cross-verify OCR labels with expected format specs.\n"
        "3. Trigger display_validation_result if conflicts are found."
    ),
    tools=[verify_mac_prefix, display_validation_result]
)
