# T008 — Safety Validation Gates

## Status
- [ ] Pending  /  [ ] In Progress  /  [ ] ✅ Completed

## Description
Develop deterministic safety validation gates in python (Pydantic models) to process and validate all structured JSON output reports before saving to databases. Integrate an LLM self-correction loop when validation rules fail.

## Acceptance Criteria (DoD)
- [ ] Build validation engine checking for schema conformance, value bounds (e.g. optical power value thresholds), and semantic consistency (overall approval vs. failing step quality).
- [ ] Failed validations generate structured error payload (stack trace, rule details) and inject it back into the agent context, prompting a retry.
- [ ] The self-correction loop attempts corrections up to 2 times (3 attempts total) before flagging the inspection as "error - manual review required".
- [ ] Unit tests mock failing JSON payloads to verify policy gate rejections and self-correction loops.

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
- Tests added:
- Notes:
