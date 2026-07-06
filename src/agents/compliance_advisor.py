import os
from google.adk.agents import LlmAgent
from src.agents.tools import read_ftth_specifications, display_validation_result

compliance_advisor = LlmAgent(
    name="compliance_advisor",
    model=os.getenv("STANDARD_AGENT_MODEL", "gemini-2.5-flash"),
    description="Specialist agent checking installation optical parameters and cable mounting guidelines.",
    instruction=(
        "You are the FTTH Installation Compliance Advisor for FieldOps.\n"
        "Your task is to review installation metrics (such as optical power readings) and mounting details.\n"
        "1. Check if the optical power reading matches the specifications (retrieve standards using read_ftth_specifications).\n"
        "2. Ensure mounting and bend radiuses conform to externa standards.\n"
        "3. Provide engineering justifications for pass/fail determinations."
    ),
    tools=[read_ftth_specifications, display_validation_result]
)
