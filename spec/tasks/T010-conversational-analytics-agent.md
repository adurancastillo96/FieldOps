# T010 — Conversational Analytics Agent

## Status
- [ ] Pending  /  [ ] In Progress  /  [ ] ✅ Completed

## Description
Develop the supervisor dashboard UI and configure a conversational agent translating natural language queries to SQL statements.

## Acceptance Criteria (DoD)
- [ ] Create simple dashboard panel page displaying active inspections, locations, and audit verdicts.
- [ ] Implement conversational agent in backend that parses user queries (e.g. "how many inspections failed this week?"), translates them to SQL queries, executes them against BigQuery, and formats text responses.
- [ ] Unit tests verify SQL generation correctness from typical prompt intents.

## Dependencies
- `T009 — Cloud Persistence Integration`

## Scope
- Create: `src/static/supervisor.html`
- Create: `src/agents/analytics.py`
- Create: `tests/test_analytics.py`
- Modify: `src/main.py`

## Constraints
- Analytics SQL executions must strictly read-only check data. Enforce query timeouts to control costs.

## References
- `spec/requirements.md` — FR-038, FR-039
- `spec/acceptance.md` — AC-052, AC-053

## Implementation Notes
- Files created:
- Tests added:
- Notes:
