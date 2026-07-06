import os
import json
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from google.cloud import bigquery

from src.agents.analytics import generate_analytics_sql, execute_mock_sql_query
from src.routes.work_orders import verify_mock_token

router = APIRouter(prefix="/analytics", tags=["Conversational Analytics"])

class QueryRequest(BaseModel):
    question: str

@router.post("/query")
async def ask_analytics(req: QueryRequest, token: str = Depends(verify_mock_token)):
    """
    Translates natural language questions to SQL and queries BigQuery (or local JSONL ledger fallback).
    """
    sql_query = generate_analytics_sql(req.question)
    
    # Try querying BigQuery if credentials are set
    try:
        project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
        if project_id and (os.getenv("GOOGLE_APPLICATION_CREDENTIALS") or os.getenv("GOOGLE_CLOUD_PROJECT")):
            client = bigquery.Client()
            query_job = client.query(sql_query)
            results = query_job.result()
            rows = [dict(row) for row in results]
            return {
                "sql": sql_query,
                "result": rows
            }
    except Exception:
        # Fallback to local JSONL evaluation
        pass

    rows = execute_mock_sql_query(sql_query)
    return {
        "sql": sql_query,
        "result": rows
    }

@router.get("/dashboard")
async def get_dashboard_metrics(token: str = Depends(verify_mock_token)):
    """
    Returns aggregated dashboard overview metrics for the supervisor panel.
    """
    ledger_path = os.path.join("uploads", "bq_mock", "ledger.jsonl")
    records = []
    
    if os.path.exists(ledger_path):
        try:
            with open(ledger_path, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        records.append(json.loads(line))
        except Exception:
            pass

    total = len(records)
    approved = sum(1 for r in records if r.get("overall_verdict") == "approved")
    rejected = sum(1 for r in records if r.get("overall_verdict") == "rejected")
    
    powers = []
    ocr_mismatches = 0
    for r in records:
        for step in r.get("steps", []):
            if step.get("step_id") == "power-meter" and step.get("optical_power_dbm") is not None:
                powers.append(step["optical_power_dbm"])
            if step.get("step_id") == "ont-after-closeup" and step.get("ocr_value"):
                # Simulates counting MAC verification mismatches
                if not step["ocr_value"].startswith("48:8F:4C"):
                    ocr_mismatches += 1

    avg_power = sum(powers) / len(powers) if powers else 0.0

    return {
        "total_installations": total,
        "approval_rate": round((approved / total * 100) if total > 0 else 0.0, 1),
        "ocr_mismatches": ocr_mismatches,
        "average_optical_power": round(avg_power, 2)
    }
