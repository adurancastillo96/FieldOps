import os
import json
import logging
from google.cloud import bigquery

logger = logging.getLogger("fieldops-bigquery")

def insert_inspection_ledger(inspection_data: dict) -> bool:
    """
    Appends structured inspection results to Google BigQuery ledgers.
    Falls back to appending to local mock JSONL file if BigQuery is unconfigured.
    """
    project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
    dataset_name = "fieldops_dataset"
    table_name = "inspection_ledger"
    
    # Try BigQuery client insert
    try:
        if project_id and (os.getenv("GOOGLE_APPLICATION_CREDENTIALS") or os.getenv("GOOGLE_CLOUD_PROJECT")):
            client = bigquery.Client()
            table_ref = f"{project_id}.{dataset_name}.{table_name}"
            
            # BigQuery rows insert expects a list of dictionaries matching schema
            errors = client.insert_rows_json(table_ref, [inspection_data])
            if not errors:
                logger.info(f"Successfully inserted inspection report into BigQuery table: {table_ref}")
                return True
            else:
                logger.error(f"BigQuery insertion returned error rows: {errors}")
    except Exception as e:
        logger.warning(f"BigQuery client insertion failed: {str(e)}. Falling back to mock local save.")

    # Mock Fallback: Save to JSONL
    mock_dir = os.path.join("uploads", "bq_mock")
    os.makedirs(mock_dir, exist_ok=True)
    mock_file = os.path.join(mock_dir, "ledger.jsonl")
    
    try:
        with open(mock_file, "a", encoding="utf-8") as f:
            f.write(json.dumps(inspection_data) + "\n")
        logger.info(f"Mocked BigQuery save completed. Record appended to {mock_file}")
        return True
    except Exception as e:
        logger.error(f"Failed to write mock BigQuery record: {str(e)}")
        return False
