# T010 — Conversational Analytics Agent

## Status
- [ ] Pending  /  [ ] In Progress  /  [x] ✅ Completed

## Description
Develop the supervisor dashboard UI and configure a conversational agent translating natural language queries to SQL statements.

## Acceptance Criteria (DoD)
- [x] Create simple dashboard panel page displaying active inspections, locations, and audit verdicts.
- [x] Implement conversational agent in backend that parses user queries (e.g. "how many inspections failed this week?"), translates them to SQL queries, executes them against BigQuery, and formats text responses.
- [x] Unit tests verify SQL generation correctness from typical prompt intents.

## Dependencies
- `T009 — Cloud Persistence Integration`

## Scope
- Create: `src/agents/analytics.py`
- Create: `src/routes/analytics.py`
- Create: `tests/test_analytics.py`
- Modify: `src/main.py`
- Modify: `src/static/index.html`
- Modify: `src/static/js/app.js`
- Modify: `src/static/css/styles.css`

## Constraints
- Analytics SQL executions must strictly read-only check data. Enforce query timeouts to control costs.

## References
- `spec/requirements.md` — FR-038, FR-039
- `spec/acceptance.md` — AC-052, AC-053

## Implementation Notes
- Files created:
  - `src/agents/analytics.py`
  - `src/routes/analytics.py`
  - `tests/test_analytics.py`
- Files modified:
  - `src/main.py` (mounted `/api/v1/analytics` router endpoints)
  - `src/static/index.html` (added Supervisor panel toggle button and dashboard metrics card fields)
  - `src/static/js/app.js` (wired supervisor metrics updates and analytical question submissions)
  - `src/static/css/styles.css` (appended styling rules for metrics cards and display log details)
- Tests added:
  - `tests/test_analytics.py` (4 test cases verifying fallback heuristic translations, SQL ledger file parser queries, query routing schemas, and dashboard metrics count ratios)
- Notes:
  - Conversational query translates questions to Google Standard SQL, executing via BigQuery client or falling back to local `ledger.jsonl` matching filters.
