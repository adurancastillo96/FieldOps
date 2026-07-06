# T004 — Local Edge QA & OCR

## Status
- [ ] Pending  /  [ ] In Progress  /  [ ] ✅ Completed

## Description
Integrate local image validation checks (blur/exposure) and OCR on device labels using ONNX Runtime Web. Implement local offline voice commands (Conductor Mode) using the browser Web Speech API (or local Whisper/Gemma 2B mock).

## Acceptance Criteria (DoD)
- [ ] Camera panel opens rear camera viewfinder, displaying visual overlay guides matching the selected step layout guidelines.
- [ ] Captured images trigger local ONNX evaluation (checks blur, exposure, framing) within 500ms, displaying green checkmark or specific remediation prompts.
- [ ] Captured label images run PaddleOCR (mocked or compiled via ONNX Web) returning text elements representing MAC address and serial number.
- [ ] Extracted MAC addresses display in confirmation panel with edit override forms.
- [ ] Implement Offline Conductor Voice Mode: browser registers microphone captures, detects intent targets ("foto", "siguiente", "repetir", "resumen"), transitions state, and announces instructions via TTS.
- [ ] Device vibrates or flashes momentarily on successful voice intent routing.

## Dependencies
- `T003 — PWA Shell & Offline Storage`

## Scope
- Create: `src/static/js/camera.js`
- Create: `src/static/js/edge-ai.js`
- Create: `src/static/js/voice-conductor.js`
- Modify: `src/static/index.html`

## Constraints
- Local models must execute client-side without calling backend servers.
- Blur and exposure tests must evaluate base64 image data structures.

## References
- `spec/requirements.md` — FR-009, FR-010, FR-011, FR-012, FR-013, FR-014, FR-015, FR-016, FR-017, FR-018, FR-019
- `spec/acceptance.md` — AC-013, AC-014, AC-015, AC-016, AC-017, AC-018, AC-019, AC-020, AC-021, AC-022, AC-023, AC-024, AC-025, AC-026, AC-027, AC-028

## Implementation Notes
- Files created:
- Tests added:
- Notes:
