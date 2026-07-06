from enum import Enum
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from src.models.work_order import MOCK_WORK_ORDERS, WorkOrder

class WorkOrderStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

router = APIRouter(prefix="/work-orders", tags=["WorkOrders"])
security = HTTPBearer(auto_error=False)

def verify_mock_token(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    """
    Dependency to verify mock authentication header.
    Accepts any token in Bearer scheme for demonstration purposes.
    """
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication token"
        )
    return credentials.credentials

@router.get("", response_model=dict)
async def list_work_orders(
    status: Optional[WorkOrderStatus] = Query(None),
    token: str = Depends(verify_mock_token)
):
    """
    Lists work orders assigned to the technician. Supports filtering by status.
    """
    # Filter work orders based on status query parameter if provided
    results = MOCK_WORK_ORDERS
    if status:
        results = [wo for wo in MOCK_WORK_ORDERS if wo.status == status]
        
    return {
        "data": results
    }

@router.get("/{id}", response_model=WorkOrder)
async def get_work_order(
    id: str,
    token: str = Depends(verify_mock_token)
):
    """
    Retrieves detailed metadata for a single work order by ID.
    """
    # Find the work order matching the requested ID
    for wo in MOCK_WORK_ORDERS:
        if wo.id == id:
            return wo
            
    # Raise a clean 404 error if work order is not found
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="The requested work order was not found"
    )
