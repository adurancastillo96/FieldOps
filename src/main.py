import os
from datetime import datetime, timezone
from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from src.routes.work_orders import router as work_orders_router
from src.routes.sync import router as sync_router
from src.routes.websocket import router as websocket_router

load_dotenv()

app = FastAPI(
    title="FieldOps API",
    description="Backend API services for FieldOps quality inspection app.",
    version="0.1.0",
)

# Set up CORS middleware for local PWA development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handler to match ErrorResponse schema
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request, exc: StarletteHTTPException):
    code_map = {
        400: "VALIDATION_ERROR",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        409: "CONFLICT",
        429: "RATE_LIMITED",
        500: "INTERNAL_ERROR"
    }
    code = code_map.get(exc.status_code, "INTERNAL_ERROR")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": code,
                "message": exc.detail,
                "details": {}
            }
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid input provided",
                "details": {"errors": exc.errors()}
            }
        }
    )

from fastapi.staticfiles import StaticFiles

from src.routes.analytics import router as analytics_router

# Register routers
app.include_router(work_orders_router, prefix="/api/v1")
app.include_router(sync_router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")
app.include_router(websocket_router)


@app.get("/api/v1/health", status_code=status.HTTP_200_OK)
async def get_health():
    """
    Returns the API health status. No authentication required.
    """
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "") + "Z"
    }

# Mount static folder for PWA frontend
app.mount("/", StaticFiles(directory="src/static", html=True), name="static")
