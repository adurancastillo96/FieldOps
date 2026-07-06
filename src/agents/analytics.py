import os
import re
import json
import logging
from google import genai
from google.genai import types

logger = logging.getLogger("fieldops-analytics")

# BigQuery schema description for grounding
BQ_SCHEMA_PROMPT = """
Target Table: `fieldops_dataset.inspection_ledger`
Schema:
- id: STRING (Unique inspection UUID)
- work_order_id: STRING (Associated work order UUID)
- technician_id: STRING (Technician identifier)
- gps_lat: FLOAT64 (GPS latitude)
- gps_lon: FLOAT64 (GPS longitude)
- overall_verdict: STRING ('approved', 'rejected', 'review_required')
- details: STRING (verdict justification detail)
- steps: ARRAY<STRUCT<
    step_id STRING,
    evidence_type STRING,
    ocr_value STRING,
    optical_power_dbm FLOAT64,
    quality_blur STRING,
    quality_exposure STRING,
    quality_framing STRING,
    image_gcs_uri STRING
  >>
"""

def generate_analytics_sql(question: str) -> str:
    """
    Translates a natural language question (Spanish) into a Google BigQuery SQL query.
    Uses Gemini API model to generate compliant SQL code blocks.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        # Static offline heuristic translator if API Key is not set
        logger.warning("GEMINI_API_KEY not found. Using local heuristic translator.")
        q = question.lower()
        if any(w in q for w in ["fall", "rechaz", "fail", "reject"]):
            return "SELECT COUNT(*) FROM `fieldops_dataset.inspection_ledger` WHERE overall_verdict = 'rejected'"
        elif any(w in q for w in ["aprob", "approv", "pass"]):
            return "SELECT COUNT(*) FROM `fieldops_dataset.inspection_ledger` WHERE overall_verdict = 'approved'"
        elif any(w in q for w in ["potencia", "power", "dbm"]):
            return "SELECT AVG(step.optical_power_dbm) FROM `fieldops_dataset.inspection_ledger`, UNNEST(steps) as step WHERE step.step_id = 'power-meter'"
        else:
            return "SELECT COUNT(*) FROM `fieldops_dataset.inspection_ledger`"

    try:
        client = genai.Client(api_key=api_key)
        prompt = (
            f"You are the Conversational Analytics Agent for FieldOps.\n"
            f"Given the following BigQuery table schema:\n{BQ_SCHEMA_PROMPT}\n\n"
            f"Translate this question into a single correct Google Standard SQL query:\n"
            f"\"{question}\"\n\n"
            f"Output ONLY the raw SQL code block. Do not include markdown code block syntax (like ```sql) or explanations."
        )
        response = client.models.generate_content(
            model=os.getenv("STANDARD_AGENT_MODEL", "gemini-2.5-flash"),
            contents=prompt
        )
        sql = response.text.replace("```sql", "").replace("```", "").strip()
        return sql
    except Exception as e:
        logger.error(f"Failed to generate SQL via Gemini: {str(e)}")
        return "SELECT COUNT(*) FROM `fieldops_dataset.inspection_ledger`"

def execute_mock_sql_query(sql_query: str) -> list:
    """
    Simulates BigQuery SQL query execution by parsing local JSONL ledger file.
    Supports count operations, average optical power aggregates, and listing records.
    """
    ledger_path = os.path.join("uploads", "bq_mock", "ledger.jsonl")
    records = []
    
    if os.path.exists(ledger_path):
        try:
            with open(ledger_path, "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        records.append(json.loads(line))
        except Exception as e:
            logger.error(f"Failed to read mock ledger file: {str(e)}")

    sql = sql_query.lower()

    # Heuristic SQL runner matching the generated queries
    if "count(*)" in sql or "count(1)" in sql:
        if "rejected" in sql:
            count = sum(1 for r in records if r.get("overall_verdict") == "rejected")
            return [{"count": count}]
        elif "approved" in sql:
            count = sum(1 for r in records if r.get("overall_verdict") == "approved")
            return [{"count": count}]
        else:
            return [{"count": len(records)}]
            
    elif "avg(step.optical_power_dbm)" in sql or "avg(" in sql:
        powers = []
        for r in records:
            for step in r.get("steps", []):
                if step.get("step_id") == "power-meter" and step.get("optical_power_dbm") is not None:
                    powers.append(step["optical_power_dbm"])
        avg_power = sum(powers) / len(powers) if powers else 0.0
        return [{"average_power": round(avg_power, 2)}]
        
    # Default fallback: return all matching records simplified
    return records[:10]
