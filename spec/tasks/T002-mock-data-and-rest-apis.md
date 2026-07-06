# T002 — Mock Data Source & REST APIs

## Status
- [ ] Pending  /  [ ] In Progress  /  [x] ✅ Completed

## Description
Develop the mock data models for work orders and inspections. Expose REST endpoints to list and retrieve work orders.

## Acceptance Criteria (DoD)
- [x] Implement synthetic data generator representing at least 3 work orders with specific fields (ID, address, model, expected MAC vendor prefix, status).
- [x] Expose `GET /api/v1/work-orders` with status parameter filtering.
- [x] Expose `GET /api/v1/work-orders/{id}` returning full work order details or `404 NOT_FOUND` for invalid IDs.
- [x] Endpoints require and validate Bearer Authorization tokens (mock check: accept any string payload in headers starting with `Bearer `).
- [x] Error responses strictly conform to the `ErrorResponse` schema in `API_SPEC.md` if authentication or route validation fails.
- [x] Integration tests verify response formats and status code assertions.

## Dependencies
- `T001 — Setup & Project Scaffold`

## Scope
- Create: `src/models/work_order.py`
- Create: `src/routes/work_orders.py`
- Modify: `src/main.py`
- Create: `tests/test_work_orders.py`

## Constraints
- Follow the error formats specified in `spec/API_SPEC.md`
- Work order status must enforce standard enums: `pending`, `in_progress`, `completed`

## References
- `spec/requirements.md` — FR-040, FR-041
- `spec/acceptance.md` — AC-054, AC-055
- `spec/openapi.yaml` (Paths `/work-orders`, `/work-orders/{id}`)

## Implementation Notes
- Files created:
  - `src/models/work_order.py`
  - `src/routes/work_orders.py`
  - `tests/test_work_orders.py`
- Tests added:
  - `tests/test_work_orders.py` (6 test cases checking list, retrieve, mock auth, filters, error payload format)
- Notes:
  - Global custom exception handlers registered in `src/main.py` to intercept HTTPExceptions and RequestValidationErrors, translating them into the standard `ErrorResponse` payload.
  - Used `enum.Enum` to enforce strict query parameter validation for the status filter.
