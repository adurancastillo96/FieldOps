# T011 — Claude-Style UI/UX and English Localization

## Status
- [ ] Pending  /  [ ] In Progress  /  [x] ✅ Completed

## Description
Redesign the user interface to follow a Claude-style layout: a left-side panel for natural conversation (interactive chat message feed, text input, and a press-to-talk microphone button) and a right-side multipurpose panel for visualization (Camera feed, Captured Photos, simulated Deployment Routes Map, Work Orders configuration, and Supervisor analytics). Additionally, fully localize the system interface, local/cloud agent instructions, and speech synthesis/recognition configurations to English.

## Acceptance Criteria (DoD)
- [x] **English Localization**:
  - [x] Every user-visible text element in `index.html`, `app.js`, `voice-conductor.js`, and `camera.js` is translated to English.
  - [x] Speech recognition (`voice-conductor.js`) language is set to English (`en-US`).
  - [x] Speech synthesis (TTS) announcements are spoken in English.
  - [x] The root orchestrator agent (`orchestrator.py`) instruction is modified to respond clearly and concisely in English.
  - [x] Conversational analytics query heuristics in `analytics.py` support English keywords (e.g., 'fail', 'reject', 'approved', 'pass', 'power').
- [x] **Claude-Style Layout**:
  - [x] The main viewport is split into two primary columns: Left panel (Chat & Voice) and Right panel (Multipurpose).
  - [x] **Left Panel (Chat)**:
    - [x] A scrollable dialogue feed containing the conversational transcript.
    - [x] A text input area at the bottom allowing the user to type messages to the agent, with a "Send" button.
    - [x] A microphone button next to the input allowing push-to-talk voice interaction.
  - [x] **Right Panel (Multipurpose)**:
    - [x] A tab bar at the top containing buttons/tabs: "Camera", "Captured Photo", "Deployment Map", "Work Orders", and "Supervisor".
    - [x] **Camera View**: Viewfinder (live video / mock canvas), guide outline box, "Capture" / "Retake" buttons, and Local Edge QA results.
    - [x] **Captured Photo View**: Shows the image captured for the selected/current step, replacing static/hidden states with an interactive view.
    - [x] **Deployment Map View**: A premium mock map representing deployment routes on Google Maps (simulating pins for customer address, hub, technician, and route paths using Canvas or SVG).
    - [x] **Work Orders View**: Dropdown selector, active metadata (Address, ONT model, MAC expected), step-by-step progress timeline, sync state indicators, and raw JSON report view.
    - [x] **Supervisor View**: Aggregated metrics dashboard (Total installations, approval rate, mismatches, average power) and the SQL Query helper.

## Dependencies
- None

## Scope
- Modify: `src/static/index.html` (Redesign layout, update text strings)
- Modify: `src/static/css/styles.css` (Adjust grid columns, add styles for two-pane layout, tabs, map, and new forms)
- Modify: `src/static/js/app.js` (Support English messages, tab switching, form inputs, mapping details)
- Modify: `src/static/js/voice-conductor.js` (Change speech locale, update transcripts, mock commands)
- Modify: `src/static/js/camera.js` (Translate alerts/mock labels)
- Modify: `src/static/js/edge-ai.js` (Translate edge feedback message)
- Modify: `src/models/work_order.py` (Add GPS lat/lon fields to work orders)
- Modify: `src/agents/orchestrator.py` (Change agent responding language instruction to English)
- Modify: `src/agents/analytics.py` (Expand query heuristics to recognize English search terms)
- Create: `tests/test_english_conversion.py` (Verify English locale updates and model field expansions)

## Constraints
- Follow conventions in `.agents/rules/coding.md`
- Keep UI responsive, clean, and styled with high-end dark-mode/glassmorphism aesthetics.
- Ensure the app passes all backend and frontend unit tests.

## References
- `spec/requirements.md` (Update NFR-012 target)
- `.agents/rules/style.md`
