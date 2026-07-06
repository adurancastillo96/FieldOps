import os
import json
import logging
from google.cloud import firestore

logger = logging.getLogger("fieldops-firestore")

def save_session_log(session_id: str, technician_id: str, log_entry: dict) -> bool:
    """
    Saves session transcript logs and metadata documents in Google Cloud Firestore.
    Falls back to saving to a local mock file if Firestore is unconfigured.
    """
    project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
    
    # Try Firestore client document write
    try:
        if project_id and (os.getenv("GOOGLE_APPLICATION_CREDENTIALS") or os.getenv("GOOGLE_CLOUD_PROJECT")):
            db = firestore.Client()
            doc_ref = db.collection("sessions").document(session_id)
            doc_ref.set({
                "technician_id": technician_id,
                "log_entry": log_entry
            }, merge=True)
            logger.info(f"Successfully saved session log to Firestore: sessions/{session_id}")
            return True
    except Exception as e:
        logger.warning(f"Firestore client save failed: {str(e)}. Falling back to mock local save.")

    # Mock Fallback: Save locally
    mock_dir = os.path.join("uploads", "firestore_mock")
    os.makedirs(mock_dir, exist_ok=True)
    mock_file = os.path.join(mock_dir, f"{session_id}.json")
    
    try:
        # Load existing log data if present
        data = {}
        if os.path.exists(mock_file):
            with open(mock_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                
        # Update session logs list
        data["technician_id"] = technician_id
        if "logs" not in data:
            data["logs"] = []
        data["logs"].append(log_entry)
        
        with open(mock_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
            
        logger.info(f"Mocked Firestore save completed. Record updated in {mock_file}")
        return True
    except Exception as e:
        logger.error(f"Failed to write mock Firestore document: {str(e)}")
        return False
