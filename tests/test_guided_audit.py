import base64
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)
AUTH_HEADERS = {"Authorization": "Bearer test-token-123"}
WO_ID = "7a3b3780-e83c-41c3-8f0a-115f5d888201"

# Generate mock 1x1 pixel image base64 to simulate upload image
MOCK_JPEG_BASE64 = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"

def test_list_work_orders():
    response = client.get("/api/v1/work-orders", headers=AUTH_HEADERS)
    assert response.status_code == 200
    assert "data" in response.json()
    assert len(response.json()["data"]) > 0

def test_get_single_work_order():
    response = client.get(f"/api/v1/work-orders/{WO_ID}", headers=AUTH_HEADERS)
    assert response.status_code == 200
    assert response.json()["id"] == WO_ID
    assert response.json()["expected_mac_prefix"] == "48:8F:4C"

def test_photo_upload_audit_failed_bend_radius():
    payload = {
        "step_id": "bend_radius",
        "image_data": MOCK_JPEG_BASE64,
        "gps_lat": 40.416775,
        "gps_lon": -3.703790
    }
    response = client.post(f"/api/v1/work-orders/{WO_ID}/upload", json=payload, headers=AUTH_HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert data["step_id"] == "bend_radius"
    assert "verdict" in data
    # Offline simulation mode fails bend_radius by default to test override flow
    assert data["verdict"]["compliance"]["overall"] == "fail"

def test_photo_upload_audit_passed_optical_power():
    payload = {
        "step_id": "optical_power",
        "image_data": MOCK_JPEG_BASE64,
        "gps_lat": 40.416775,
        "gps_lon": -3.703790
    }
    response = client.post(f"/api/v1/work-orders/{WO_ID}/upload", json=payload, headers=AUTH_HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert data["verdict"]["compliance"]["overall"] == "pass"
    assert data["verdict"]["compliance"]["extracted_data"]["optical_power_dbm"] == -18.5

def test_chat_override_justification():
    # Send a message containing override keywords
    payload = {
        "message": "override bend_radius since the cabinet is too narrow"
    }
    response = client.post(f"/api/v1/work-orders/{WO_ID}/chat", json=payload, headers=AUTH_HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert data["action"] is not None
    assert data["action"]["type"] == "override_step"
    assert data["action"]["step_id"] == "bend_radius"
    assert data["action"]["status"] == "completed_with_deviation"
    assert "cabinet is too narrow" in data["action"]["justification"]

def test_chat_general_query():
    payload = {
        "message": "hello"
    }
    response = client.post(f"/api/v1/work-orders/{WO_ID}/chat", json=payload, headers=AUTH_HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert data["action"] is None

def test_generate_markdown_report():
    response = client.get(f"/api/v1/work-orders/{WO_ID}/report", headers=AUTH_HEADERS)
    assert response.status_code == 200
    report_text = response.text
    assert "# FTTH Installation Audit Report" in report_text
    assert WO_ID in report_text
    assert "1. Fiber Bend Radius" in report_text
    assert "2. Optical Power Reading" in report_text
    # Check if the override justification is captured in the report compile
    assert "cabinet is too narrow" in report_text
