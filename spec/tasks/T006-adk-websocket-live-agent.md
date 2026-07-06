# T006 — ADK WebSocket & Real-time Live Agent

## Status
- [ ] Pending  /  [ ] In Progress  /  [ ] ✅ Completed

## Description
Establish the real-time WebSocket communication gateway between the browser and the cloud backend. Set up Gemini 2.5 Live audio session pipeline using Google ADK, providing voice streaming (input and output) and active barge-in control.

## Acceptance Criteria (DoD)
- [ ] Backend exposes `/ws/{user_id}/{session_id}` WebSocket endpoint.
- [ ] Setup `LiveRequestQueue` inside WebSocket connection loop, running async loops to stream PCM input to Vertex AI and output PCM back to the client.
- [ ] Implement client-side `audio-recorder.js` capturing 16kHz mono audio and sending mono PCM over WebSocket.
- [ ] Implement client-side `audio-player.js` playing 24kHz mono audio stream received from backend.
- [ ] Client-side voice recorder successfully detects user speech overlaps (barge-in), flushes playing audio queues, and suspends incoming stale output.
- [ ] Recoverable WebSocket drops trigger auto-reconnection with exponential backoff (starting at 1.5s).

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
- Tests added:
- Notes:
