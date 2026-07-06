import os
import logging
from google.cloud import storage

logger = logging.getLogger("fieldops-gcs")

def upload_image(work_order_id: str, step_id: str, file_bytes: bytes, filename: str) -> str:
    """
    Uploads evidence photos to Google Cloud Storage.
    Falls back to saving to a local mock folder if GCS credentials are not set.
    """
    bucket_name = os.getenv("GCS_BUCKET", "fieldops-inspections-bucket")
    gcs_path = f"{work_order_id}/{step_id}/{filename}"
    
    # Try GCS client upload
    try:
        # Check if GCP credentials or project config is set
        if os.getenv("GOOGLE_APPLICATION_CREDENTIALS") or os.getenv("GOOGLE_CLOUD_PROJECT"):
            client = storage.Client()
            bucket = client.bucket(bucket_name)
            blob = bucket.blob(gcs_path)
            blob.upload_from_string(file_bytes, content_type="image/jpeg")
            logger.info(f"Successfully uploaded photo to GCS: gs://{bucket_name}/{gcs_path}")
            return f"gs://{bucket_name}/{gcs_path}"
    except Exception as e:
        logger.warning(f"GCS client upload failed: {str(e)}. Falling back to mock local save.")

    # Mock Fallback: Save locally
    mock_dir = os.path.join("uploads", "gcs_mock", work_order_id, step_id)
    os.makedirs(mock_dir, exist_ok=True)
    mock_path = os.path.join(mock_dir, filename)
    
    with open(mock_path, "wb") as f:
        f.write(file_bytes)
        
    logger.info(f"Mocked GCS save completed. File stored locally: {mock_path}")
    return f"gs://{bucket_name}/{gcs_path} (Simulated)"
