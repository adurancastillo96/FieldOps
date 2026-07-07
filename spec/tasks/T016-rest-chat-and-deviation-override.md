# T016 — REST Chat & Deviation Override Agent

## Status
- [ ] Pending  /  [ ] In Progress  /  [ ] Completed

## Description
Build the backend REST API endpoint `POST /api/v1/work-orders/{id}/chat` for conversational text-based agent assistance. The root Orchestrator agent processes the technician's messages in English. If the technician types or dictates a deviation override (e.g. justifying a failed step due to site restrictions), the agent registers the justification, marks the step as completed with deviation, and overrides the navigation block.

## Acceptance Criteria (DoD)
- **FastAPI Chat Router**:
  - Exposes `POST /api/v1/work-orders/{id}/chat` taking a string `message`.
  - Runs the root Orchestrator agent to process the query.
- **Deviation Logging**:
  - Recognizing statements like "override", "justify", or physical space descriptions logs the justification for the active step.
  - Overrides step blocking and returns `{ "reply": "...", "action": { "type": "override_step", "step_id": "...", "status": "completed_with_deviation", "justification": "..." } }`.

## Scope
- Modify: `src/routes/work_orders.py` (Add the chat endpoint)
- Modify: `src/agents/orchestrator.py` (Configure text reasoning and deviation routing tools)

## Constraints
- Agent replies must be in English.
