# T008 — Safety Validation Gates

## Status
- [ ] Pending  /  [ ] In Progress  /  [x] ✅ Completed

## Description
Develop deterministic safety validation gates in python (Pydantic models) to process and validate all structured JSON output reports before saving to databases. Integrate an LLM self-correction loop when validation rules fail.

## Acceptance Criteria (DoD)
- [x] Build validation engine checking for schema conformance, value bounds (e.g. optical power value thresholds), and semantic consistency (overall approval vs. failing step quality).
- [x] Failed validations generate structured error payload (stack trace, rule details) and inject it back into the agent context, prompting a retry.
- [x] The self-correction loop attempts corrections up to 2 times (3 attempts total) before flagging the inspection as "error - manual review required".
- [x] Unit tests mock failing JSON payloads to verify policy gate rejections and self-correction loops.

## Dependencies
- `T007 — Specialist Cognitive Agents`

## Scope
- Create: `src/agents/policy_gate.py`
- Create: `tests/test_policy_gate.py`

## Constraints
- Policy gate checks must run on pure Python logic (no LLM calls) to maintain high speed and predictable safety guarantees.

## References
- `spec/requirements.md` — FR-033, FR-034
- `spec/acceptance.md` — AC-045, AC-046, AC-047, AC-048

## Implementation Notes
- Files created:
  - `src/agents/policy_gate.py`
  - `tests/test_policy_gate.py`
- Tests added:
  - `tests/test_policy_gate.py` (6 test cases checking valid reports, enum constraints, logical contradictions, out of bounds optical power readings, and async self-correction loop mock retries)
- Notes:
  - Validation rules enforce that no inspection step can have failed quality flags if the overall verdict is marked as approved.
  - Replaced a missing json import bug in `policy_gate.py` that was identified and resolved by pytest runs.
