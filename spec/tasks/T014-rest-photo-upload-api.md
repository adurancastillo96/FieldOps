# T014 — REST Photo Upload & Audit API

## Status
- [ ] Pending  /  [ ] In Progress  /  [ ] Completed

## Description
Build the backend REST API endpoint `POST /api/v1/work-orders/{id}/upload` to receive uploaded photo files (or base64 representations) and simulated GPS coordinates. This endpoint triggers the ADK cloud vision audit pipeline, saves the image to local files (or GCS), and returns a structured JSON verdict.

## Acceptance Criteria (DoD)
- **FastAPI Upload Router**:
  - Exposes `POST /api/v1/work-orders/{id}/upload` accepting `step_id`, `image_data`, and optional GPS fields.
  - Saves the image payload as a local file (e.g. under `uploads/` directory) and maps its metadata.
  - Invokes the ADK Vision Auditor agents to perform compliance and quality checks.
- **Audit Response**:
  - Returns HTTP 200 with structured verdict data: `{ "step_id": "...", "status": "pass"|"fail", "verdict": { "quality": { "blur": "pass", ... }, "compliance": { "overall": "pass", "details": "..." } } }`.

## Scope
- Create/Modify: `src/routes/work_orders.py` (Add the upload route)
- Modify: `src/main.py` (Ensure upload routers and static upload directories are mounted correctly)

## Constraints
- Return audit verdicts in structured JSON.
