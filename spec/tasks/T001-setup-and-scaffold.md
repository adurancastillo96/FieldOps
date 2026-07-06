# T001 — Setup & Project Scaffold

## Status
- [ ] Pending  /  [ ] In Progress  /  [x] ✅ Completed

## Description
Create the base project structure, environment configuration, package configuration, and initial FastAPI app structure with a running public health check endpoint.

## Acceptance Criteria (DoD)
- [x] Root directory contains `pyproject.toml` configuration mapping dependency libraries (`google-adk`, `fastapi`, `uvicorn`, `python-dotenv`, `google-cloud-storage`, `google-cloud-firestore`, `google-cloud-bigquery`).
- [x] `.env.example` lists all necessary configurations for Vertex AI, GCS bucket names, and mock credential variables.
- [x] Backend package compiles and installs cleanly in editable mode (`pip install -e .` or package manager equivalent).
- [x] Running local server exposes `GET /api/v1/health` matching the OpenAPI contract.
- [x] Unit tests verify health check endpoint responds with `200 OK` and structured status payload.

## Dependencies
- None

## Scope
- Create: `pyproject.toml` (or standard Python package configuration)
- Create: `.env.example`
- Create: `src/main.py`
- Create: `src/__init__.py`
- Create: `tests/test_health.py`

## Constraints
- Follow instructions in `.agents/rules/coding.md`
- Target Python version 3.11+
- Public routes must not require Bearer authorization headers

## References
- `spec/openapi.yaml` (Paths `/health` and Response schemas)
- `spec/plan.md` (Implementation Step 1)
- `.agents/rules/coding.md`

## Implementation Notes
- Files created:
  - `pyproject.toml`
  - `.env.example`
  - `src/main.py`
  - `src/__init__.py`
  - `tests/test_health.py`
- Tests added:
  - `tests/test_health.py::test_get_health`
- Notes:
  - Dependencies successfully installed using `uv venv` and `uv pip install -e ".[dev]"`.
  - Refactored `datetime.utcnow()` to `datetime.now(timezone.utc)` to prevent deprecation warnings.
