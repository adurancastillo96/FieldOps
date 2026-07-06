import pytest
from fastapi.testclient import TestClient
from src.main import app
from src.models.work_order import WorkOrder, MOCK_WORK_ORDERS
from src.agents.orchestrator import root_agent
from src.agents.analytics import generate_analytics_sql

client = TestClient(app)

def test_work_order_gps_fields():
    # Verify the WorkOrder model schema contains gps_lat and gps_lon fields
    assert "gps_lat" in WorkOrder.model_fields
    assert "gps_lon" in WorkOrder.model_fields
    
    # Verify the mock work orders are loaded with coordinates
    for wo in MOCK_WORK_ORDERS:
        assert wo.gps_lat is not None
        assert wo.gps_lon is not None

def test_work_orders_api_gps_coordinates():
    # Verify the JSON responses from retrieve work orders endpoints contain the GPS coordinates
    headers = {"Authorization": "Bearer test-token-123"}
    response = client.get("/api/v1/work-orders", headers=headers)
    assert response.status_code == 200
    data = response.json()
    
    # Verify Madrid coordinates in the first mock work order
    wo_madrid = data["data"][0]
    assert wo_madrid["gps_lat"] == 40.416775
    assert wo_madrid["gps_lon"] == -3.703790
    
    # Verify single work order endpoint
    wo_id = wo_madrid["id"]
    single_resp = client.get(f"/api/v1/work-orders/{wo_id}", headers=headers)
    assert single_resp.status_code == 200
    single_data = single_resp.json()
    assert single_data["gps_lat"] == 40.416775
    assert single_data["gps_lon"] == -3.703790

def test_root_agent_language_instruction():
    # Verify the orchestrator system prompt asks to speak in English instead of Spanish
    prompt = root_agent.instruction
    assert "English (en-US)" in prompt
    assert "Spanish (es-ES)" not in prompt

def test_conversational_analytics_heuristics_english():
    # Test that English keywords are translated offline correctly
    sql_fail = generate_analytics_sql("how many failed inspections do we have?")
    assert "rejected" in sql_fail
    
    sql_pass = generate_analytics_sql("show all approved items")
    assert "approved" in sql_pass
    
    sql_power = generate_analytics_sql("what is the average power level?")
    assert "average_optical_power" in sql_power or "power-meter" in sql_power
