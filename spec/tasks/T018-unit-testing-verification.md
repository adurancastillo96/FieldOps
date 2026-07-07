# T018 — Unit Testing & Verification

## Status
- [ ] Pending  /  [ ] In Progress  /  [ ] Completed

## Description
Write comprehensive backend and frontend unit tests to verify the REST upload auditing endpoint, the chat endpoint, visual compliance checks, and deviation override justifications. Execute the test suite and ensure all tests pass.

## Acceptance Criteria (DoD)
- **REST Upload & Chat Tests**:
  - Test uploading photos and receiving structured verdicts.
  - Test sending messages to `/chat` and verifying agent overrides for step blockages when a valid justification is provided.
- **Test execution**:
  - All existing and new tests pass cleanly with 100% success rate.

## Scope
- Create: `tests/test_guided_audit.py` (Add new REST audit and chat override unit tests)
- Modify: `tests/test_work_orders.py` (Verify work order API modifications)

## Constraints
- Run tests locally using Pytest.
