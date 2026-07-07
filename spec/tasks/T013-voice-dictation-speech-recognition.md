# T013 — Browser-Based Local Voice Dictation

## Status
- [ ] Pending  /  [ ] In Progress  /  [ ] Completed

## Description
Repurpose the left-hand microphone button (`btn-voice-agent`) from WebSockets audio streaming to local browser-based voice dictation. Clicking/holding the microphone button triggers browser SpeechRecognition in English, transcribing user speech locally, and placing the resulting text directly into the chat input box.

## Acceptance Criteria (DoD)
- **Local Speech Recognition**:
  - Tapping or holding the mic button initiates `webkitSpeechRecognition` (or standard `SpeechRecognition` API) in `en-US`.
  - While recording, the mic button shows a pulsing recording state.
  - Transcribed words are printed dynamically into the text chat input box (`text-input`).
- **Graceful Failures**:
  - If browser speech recognition is unsupported or blocked, the mic button fails silently with a brief placeholder message or console warning, keeping text inputs fully operational.

## Scope
- Modify: `src/static/js/voice-conductor.js` (Rewrite to initialize local browser SpeechRecognition instead of raw websocket audio streaming)
- Modify: `src/static/js/app.js` (Wire microphone button events to local dictation controls)

## Constraints
- Dictation language must be `en-US`.
- Speech recognition must occur completely locally in the browser.
