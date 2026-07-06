# T009 — Cloud Persistence Integration

## Status
- [ ] Pending  /  [ ] In Progress  /  [x] ✅ Completed

## Description
Connect the backend services to Google Cloud Platform databases. Implement image upload to Google Cloud Storage, final inspection audit report ingestion into BigQuery tables, and technician history logging into Google Cloud Firestore.

## Acceptance Criteria (DoD)
- [x] Uploaded image files save to GCS bucket structured paths: `gs://{bucket}/{work_order_id}/{step_id}/{timestamp}.jpg`.
- [x] final inspection JSON verdicts write to a partitioned BigQuery table, storing metadata, coordinates, overall verdict state, and step details.
- [x] Firestore models track technician active sessions and persist completed installation stats.
- [x] Session routing data, log details, and agent transcripts store inside Firestore collection logs.
- [x] Integrations verify connectivity, handling missing configurations gracefully with mock local drop-in saves.

## Dependencies
- `T008 — Safety Validation Gates`
- `T002 — Mock Data Source & REST APIs`

## Scope
- Create: `src/services/gcs.py`
- Create: `src/services/bigquery.py`
- Create: `src/services/firestore.py`
- Create: `tests/test_persistence.py`

## Constraints
- Database connections must read IAM credentials from Application Default Credentials (ADC) / Server-side env vars.
- No hardcoded access credentials in source code.

## References
- `spec/requirements.md` — FR-003, FR-035, FR-036, FR-037
- `spec/acceptance.md` — AC-049, AC-050, AC-051

## Implementation Notes
- Files created:
  - `src/services/gcs.py`
  - `src/services/bigquery.py`
  - `src/services/firestore.py`
  - `tests/test_persistence.py`
- Files modified:
  - `src/routes/sync.py` (wired GCS upload and BQ ingestion during file synchronization)
  - `src/routes/websocket.py` (wired Firestore logging of transcripts on turnComplete event detections)
- Tests added:
  - `tests/test_persistence.py` (3 test cases verifying local mock fallbacks for GCS file writes, BigQuery JSONL appends, and Firestore JSON document logs)
- Notes:
  - Mock fallbacks write files under `uploads/` directory to prevent test runs from crashing in environments where GCP ADC keys are not active. Ensure folders are purged during test teardowns.
