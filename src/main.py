import os
from datetime import datetime, timezone
from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

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


@app.get("/api/v1/health", status_code=status.HTTP_200_OK)
async def get_health():
    """
    Returns the API health status. No authentication required.
    """
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "") + "Z"
    }
