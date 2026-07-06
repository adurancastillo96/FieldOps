import os
from google.adk.agents import Agent
from dotenv import load_dotenv

load_dotenv()

# Basic Root Agent mock for T006 WebSocket validation
# Will be expanded into the multi-agent hierarchy in T007
root_agent = Agent(
    name="fieldops_orchestrator",
    model=os.getenv("DEMO_AGENT_MODEL", "gemini-live-2.5-flash-native-audio"),
    instruction="Eres el asistente de voz de FieldOps. Ayuda al técnico a completar la inspección del ONT.",
    tools=[]
)

# Mock logger helper
_SESSION_LOG = []

def log_ai_interaction(user_text: str, agent_text: str):
    if not user_text and not agent_text:
        return None
    entry = {
        "timestamp": os.getpid(),  # simple mock identifier
        "user": user_text,
        "agent": agent_text
    }
    _SESSION_LOG.append(entry)
    return entry
