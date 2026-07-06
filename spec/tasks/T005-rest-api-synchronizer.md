# T005 — REST API Synchronizer

## Status
- [ ] Pending  /  [ ] In Progress  /  [x] ✅ Completed

## Description
Develop the endpoint to receive, parse, and coordinate offline synchronized inspections. Handle multipart form uploads, extracting metadata JSON structures and saving attached images to local mock folders (preparing for GCS storage).

## Acceptance Criteria (DoD)
- [x] Create `POST /api/v1/sync` endpoint accepting multipart form requests containing `payload` and binary files.
- [x] Validate payload JSON structure matches specification (UUID inspection ID, work order association, list of completed steps, coordinates).
- [x] Incoming files are correctly saved to local backend upload directories, matching subfolder path structure: `uploads/{work_order_id}/{step_id}/{filename}`.
- [x] Synchronized inspections return HTTP 200 with JSON payload containing audit verdict details.
- [x] Integration tests verify payload mapping and mock uploads validation.

## Dependencies
- `T002 — Mock Data Source & REST APIs`

## Scope
- Create: `src/routes/sync.py`
- Modify: `src/main.py`
- Create: `tests/test_sync.py`

## Constraints
- Ensure proper file permission checks when saving images to disk.
- Reject sync uploads exceeding total 20MB file sizes.

## References
- `spec/requirements.md` — FR-003
- `spec/acceptance.md` — AC-005, AC-006, AC-049
- `spec/openapi.yaml` (Paths `/sync`)

## Implementation Notes
- Files created:
  - `src/routes/sync.py`
  - `tests/test_sync.py`
- Tests added:
  - `tests/test_sync.py` (6 test cases checking sync success, quality rejects, optical power compliance range checks, unauthorized checks, file limit checks, and bad JSON parses)
- Notes:
  - The synchronizer REST gateway handles files in parallel, placing them in `uploads/{work_order_id}/{step_id}/{filename}`.
  - Implemented automatic file size calculation and size limits checking (throwing validation error if files exceed 20MB in total).
  - Wired temporary local compliance rules: validation checks evaluate local quality checks and optical power ranges (-28.0 to -8.0 dBm) to yield the final PASS/FAIL verdict, before cognitive agents are loaded.
