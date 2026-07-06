# Architectural Decisions Log

Record of significant decisions made during development.
Each entry links to a full ADR in `docs/ADR/` when applicable.

| Date | Decision | Rationale | ADR |
|------|----------|-----------|-----|
| 2026-07-06 | WebSocket Live Audio Streaming | Built 16kHz upstream / 24kHz downstream AudioWorklet player/recorder with client VAD barge-in checks. | - |
| 2026-07-06 | Multi-Agent Cognitive Network | Root orchestrator with `photo_auditor`, `compliance_advisor`, `ocr_verifier` using `LlmAgent` and whitelisted parameter grounding. | - |
| 2026-07-06 | Deterministic Safety Policy Gate | Pydantic model validation on completed reports with LLM self-correction retry loops. | - |
| 2026-07-06 | Cloud Persistence local mocks | Graceful local filesystem saves if GCS/BigQuery/Firestore libraries fail to verify credentials. | - |
| 2026-07-06 | Conversational SQL translation | Translates natural language questions to read-only BigQuery standard SQL, executing against ledger file if unconfigured. | - |

## How to Use This File
- Add a new row for every significant technical decision.
- Link to a full ADR for decisions that affect architecture.
- Review this file at the start of each session for context.
- Never delete entries — they are historical record.
