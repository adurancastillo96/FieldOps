# T007 — Specialist Cognitive Agents

## Status
- [ ] Pending  /  [ ] In Progress  /  [x] ✅ Completed

## Description
Design the Google ADK Multi-Agent hierarchy. Create the Root Orchestrator Agent and three specialist sub-agents (Photo Quality Auditor, Installation Compliance, OCR Verification). Concatenate FTTH compliance guidelines from local static files. Expose tools returning standard JSON `render_command` specifications to drive PWA transitions.

## Acceptance Criteria (DoD)
- [x] Root orchestrator maps tool definitions and manages dynamic routing via `transfer_to_agent()`.
- [x] Photo Quality Auditor agent uses Gemini 1.5 Flash Vision to inspect pictures and return structured JSON quality metrics (blur, exposure, framing).
- [x] Installation Compliance agent checks device installations against rules defined in knowledge base (optical power limits, bend radius limits).
- [x] OCR Verification agent compares edge OCR labels with cloud vision extraction.
- [x] Define standard tool functions returning `render_command` payloads (e.g. `navigate_step`, `display_validation_result`).
- [x] Static knowledge base files (.txt/.md) load from `knowledge-base/` directory and inject into agent system prompts during startup.
- [x] Grounding callbacks (`_grounding_before_tool` / `_grounding_after_tool`) execute before and after tool calls, validating arguments against schema definitions.

## Dependencies
- `T006 — ADK WebSocket & Real-time Live Agent`
- `T005 — REST API Synchronizer`

## Scope
- Create: `src/agents/orchestrator.py`
- Create: `src/agents/quality_auditor.py`
- Create: `src/agents/compliance_advisor.py`
- Create: `src/agents/ocr_verifier.py`
- Create: `src/agents/tools.py`
- Create: `knowledge-base/kb-ftth-optical-standards.txt`
- Create: `knowledge-base/kb-ftth-installation-rules.txt`

## Constraints
- LLM calls must enforce JSON response formats using schemas or clear parsing gates.
- Multi-agent routing should occur without explicit python code logic (rely on ADK agent transitions).

## References
- `spec/requirements.md` — FR-005, FR-022, FR-023, FR-025, FR-026, FR-027, FR-028, FR-029, FR-030, FR-031, FR-032
- `spec/acceptance.md` — AC-008, AC-031, AC-032, AC-033, AC-035, AC-036, AC-037, AC-038, AC-039, AC-040, AC-041, AC-042, AC-043, AC-044

## Implementation Notes
- Files created:
  - `src/agents/quality_auditor.py`
  - `src/agents/compliance_advisor.py`
  - `src/agents/ocr_verifier.py`
  - `src/agents/tools.py`
  - `knowledge-base/kb-ftth-optical-standards.txt`
  - `knowledge-base/kb-ftth-installation-rules.txt`
  - `tests/test_agents.py`
- Files modified:
  - `src/agents/orchestrator.py` (overwrote the mock with the full orchestrator structure)
- Tests added:
  - `tests/test_agents.py` (11 unit test cases verifying parameter grounding callbacks, mock tool execution, and local KB file readers)
- Notes:
  - Added parameter grounding whitelist checkers for `navigate_step` step IDs, `display_validation_result` verdicts, and `read_ftth_specifications` topics.
  - Sub-agents are correctly linked in the Root Orchestrator via ADK's `sub_agents` parameters, letting Gemini dynamically delegate tasks.
