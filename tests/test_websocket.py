import json
import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

# Helper mock for runner.run_live async generator
async def mock_run_live_gen(*args, **kwargs):
    class MockEvent:
        def model_dump_json(self, *args, **kwargs):
            return json.dumps({
                "outputTranscription": {"text": "Hola, soy el asistente FieldOps."},
                "turnComplete": True
            })
    yield MockEvent()

@patch("google.adk.runners.Runner.run_live", side_effect=mock_run_live_gen)
def test_websocket_live_session(mock_run_live):
    with client.websocket_connect("/ws/tech-01/session-123") as websocket:
        # Test sending a mock JSON client event
        websocket.send_text(json.dumps({
            "type": "text",
            "content": "iniciar inspección"
        }))
        
        # Receive the first event from our mock run_live generator
        data_str = websocket.receive_text()
        data = json.loads(data_str)
        
        # Verify response matches our mock structure
        assert "outputTranscription" in data
        assert data["outputTranscription"]["text"] == "Hola, soy el asistente FieldOps."
        assert data["turnComplete"] is True
        
        # Receive the next log sync message sent by main turnComplete callback
        log_str = websocket.receive_text()
        log_data = json.loads(log_str)
        assert log_data["type"] == "ai_log"
        assert log_data["entry"]["agent"] == "Hola, soy el asistente FieldOps."

# Helper mock for runner.run_live raising an exception
async def mock_run_live_gen_error(*args, **kwargs):
    class MockEvent:
        def model_dump_json(self, *args, **kwargs):
            return json.dumps({
                "outputTranscription": {"text": "Error demo"},
                "turnComplete": False
            })
    yield MockEvent()
    raise RuntimeError("Vertex API error simulation")

@patch("google.adk.runners.Runner.run_live", side_effect=mock_run_live_gen_error)
def test_websocket_live_session_error(mock_run_live):
    try:
        with client.websocket_connect("/ws/tech-01/session-456") as websocket:
            # First event is successfully sent
            data_str = websocket.receive_text()
            data = json.loads(data_str)
            assert data["outputTranscription"]["text"] == "Error demo"
            
            # Next message should be the error message sent to client
            error_str = websocket.receive_text()
            error_data = json.loads(error_str)
            assert error_data["type"] == "error"
            assert "Vertex API error simulation" in error_data["message"]
    except Exception as exc:
        if isinstance(exc, AssertionError):
            raise
