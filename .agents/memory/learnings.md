# Learnings Log

What worked, what didn't, and what we learned along the way.

| Date | Category | Context | Learning | Action Taken |
|------|----------|---------|----------|--------------|
| 2026-07-06 | Didn't Work | Agent Definition (`src/agents/orchestrator.py`) | ADK `LlmAgent` names must be valid Python identifiers; using hyphens raises Pydantic `ValidationError`. | Changed agent name to use underscores (`fieldops_orchestrator`). |
| 2026-07-06 | Worked | GCP Persistence Integration (`src/services/`) | Providing mock filesystem drop-in saves allowed 100% of unit tests to execute cleanly without active GCP ADC credentials. | Saved files locally under `uploads/` directory on service client creation errors. |
| 2026-07-07 | Pattern | WebSocket Session Lifecycle (`src/routes/websocket.py`) | Always explicitly close the `LiveRequestQueue` and call `websocket.close()` in a `finally` block to prevent zombie Vertex AI session leaks. Catch general `Exception` in downstreams to forward structured error messages (e.g. API quota/permissions issues) before closing. | Implemented queue/socket close safety block and caught general exceptions to send error packets. Verified with test case. |

## Categories
- **Worked**: Approaches or patterns that proved effective
- **Didn't Work**: Approaches that failed or caused issues
- **Pattern**: Useful patterns to follow in similar situations
- **Anti-Pattern**: Patterns to avoid — they cause problems

## How to Use This File
- Add a row after each significant development session.
- Be specific: what was tried, what happened, what we do differently now.
- Reference task IDs and file paths when applicable.
- Review this file when starting similar work to avoid repeating mistakes.
- Never delete entries — they are historical record.
