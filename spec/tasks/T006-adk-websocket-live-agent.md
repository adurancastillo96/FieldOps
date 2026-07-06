# T006 — ADK WebSocket & Real-time Live Agent

## Status
- [ ] Pending  /  [ ] In Progress  /  [x] ✅ Completed

## Description
Establish the real-time WebSocket communication gateway between the browser and the cloud backend. Set up Gemini 2.5 Live audio session pipeline using Google ADK, providing voice streaming (input and output) and active barge-in control.

## Acceptance Criteria (DoD)
- [x] Backend exposes `/ws/{user_id}/{session_id}` WebSocket endpoint.
- [x] Setup `LiveRequestQueue` inside WebSocket connection loop, running async loops to stream PCM input to Vertex AI and output PCM back to the client.
- [x] Implement client-side `audio-recorder.js` capturing 16kHz mono audio and sending mono PCM over WebSocket.
- [x] Implement client-side `audio-player.js` playing 24kHz mono audio stream received from backend.
- [x] Client-side voice recorder successfully detects user speech overlaps (barge-in), flushes playing audio queues, and suspends incoming stale output.
- [x] Recoverable WebSocket drops trigger auto-reconnection with exponential backoff (starting at 1.5s).

## Dependencies
- `T003 — PWA Shell & Offline Storage`

## Scope
- Create: `src/static/js/audio-player.js`
- Create: `src/static/js/audio-recorder.js`
- Create: `src/static/js/pcm-processor.js`
- Create: `src/routes/websocket.py`
- Modify: `src/main.py`

## Constraints
- Connection loops must run concurrently (`asyncio.wait(FIRST_EXCEPTION)`) and properly clean up active ADK streams on close.
- Voice parameters must target native dialog models (e.g. `gemini-live-2.5-flash-native-audio`).

## References
- `spec/requirements.md` — FR-020, FR-021, FR-024
- `spec/acceptance.md` — AC-029, AC-030, AC-034
- `spec/plan.md` (Technical Decisions, WebSocket Setup)

## Implementation Notes
- Files created:
  - `src/static/js/audio-player.js`
  - `src/static/js/audio-recorder.js`
  - `src/static/js/pcm-processor.js` (refactored placeholders)
  - `src/routes/websocket.py`
  - `tests/test_websocket.py`
  - `src/agents/orchestrator.py` (temporary placeholder agent definition to unblock routing)
- Tests added:
  - `tests/test_websocket.py::test_websocket_live_session` (mocks `runner.run_live` async generator to simulate conversational turns and turnComplete log routing)
  - `tests/test_pwa.py` (added tests verifying static script deliverability for player, recorder, and processors)
- Notes:
  - Combined `pcm-player-processor` and `pcm-recorder-processor` registrations into a single file `pcm-processor.js` to simplify PWA resource cache management.
  - Implemented client-side VAD overlap barge-in suppression checks: user microphone captures override output transcription playback queues.
  - Corrected google-adk LlmAgent naming error by replacing hyphenated `fieldops-orchestrator` with valid Python identifier `fieldops_orchestrator`.
