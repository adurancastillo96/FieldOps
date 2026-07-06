from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field

class WorkOrder(BaseModel):
    id: str = Field(..., description="Unique work order UUID")
    created_at: str = Field(..., description="Creation timestamp")
    updated_at: str = Field(..., description="Last update timestamp")
    address: str = Field(..., description="Installation address")
    ont_model: str = Field(..., description="Target ONT device model")
    expected_mac_prefix: str = Field(..., description="Expected MAC vendor prefix")
    assigned_technician_id: str = Field(..., description="Assigned technician username")
    status: str = Field(..., description="Status: pending, in_progress, completed")

# Seed mock database list
MOCK_WORK_ORDERS = [
    WorkOrder(
        id="7a3b3780-e83c-41c3-8f0a-115f5d888201",
        created_at="2026-07-06T18:00:00Z",
        updated_at="2026-07-06T18:00:00Z",
        address="Calle Principal 123, Madrid",
        ont_model="HG8145V5",
        expected_mac_prefix="48:8F:4C",
        assigned_technician_id="tech-01",
        status="pending"
    ),
    WorkOrder(
        id="d74fb899-73e4-4a2e-8392-4fdfb32bb902",
        created_at="2026-07-06T18:05:00Z",
        updated_at="2026-07-06T18:05:00Z",
        address="Avenida del Sol 45, Barcelona",
        ont_model="EG8145V5",
        expected_mac_prefix="00:25:9E",
        assigned_technician_id="tech-01",
        status="in_progress"
    ),
    WorkOrder(
        id="a184e1b8-6fb2-4752-9b2f-3729e2468303",
        created_at="2026-07-06T17:30:00Z",
        updated_at="2026-07-06T18:10:00Z",
        address="Plaza Mayor 8, Sevilla",
        ont_model="HG8245H",
        expected_mac_prefix="E0:24:7F",
        assigned_technician_id="tech-02",
        status="completed"
    )
]
