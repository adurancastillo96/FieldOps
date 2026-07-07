# Requirements — EARS Notation (New Cycle)

Requirements written in Easy Approach to Requirements Syntax (EARS).

## EARS Patterns Reference
- **Ubiquitous**: The [system] shall [action]
- **Event-driven**: When [event], the [system] shall [action]
- **State-driven**: While [state], the [system] shall [action]
- **Optional**: Where [condition], the [system] shall [action]
- **Unwanted**: If [unwanted condition], the [system] shall [action]

---

## Functional Requirements

### PWA Shell & Layout Core
- **FR-001**: The system shall provide an installable Progressive Web App (PWA) with a Service Worker that caches the UI shell and assets.
- **FR-002**: The system shall implement a Claude-style split viewport layout:
  - **Left Column**: Interactive text chat log, manual message entry, and a voice-assisted mic button.
  - **Right Column**: Multipurpose view tabs to navigate step uploader widgets, captured photo preview overlays, interactive route maps, audit verdicts, and report previews.
- **FR-003**: The PWA interface, chat replies, and system instructions shall be strictly in English.

### Step-by-Step Guided Photo Uploader
- **FR-004**: The system shall guide the technician step-by-step through a 4-step FTTH installation protocol:
  1. **Fiber Bend Radius**: Uploading a photo of the routed fiber cable to inspect tight bends.
  2. **Optical Power Meter (OPM)**: Uploading a photo of the OPM display displaying the signal strength.
  3. **Device Label (ONT/ONU)**: Uploading a close-up photo of the device barcode and serial label.
  4. **Labeling & Enclosure**: Uploading a photo showing print labels and the closed enclosure.
- **FR-005**: When the technician uploads a photo, the system shall run an instant cloud-based vision audit, render audit status (Pass/Fail/Review), and update the checklist details.
- **FR-006**: The system shall prevent advancing to the next step unless the current step has a passing audit, or the technician logs a deviation justification in the chat.

### Camera & Static Photo Uploads
- **FR-007**: The system shall allow the technician to either capture a photo using the device camera (via HTML5 input capture) or drag-and-drop/select a static image file.
- **FR-008**: When a photo is uploaded, the system shall associate GPS coordinates, a timestamp, the work order ID, and the step ID with the file payload.

### Browser Voice Dictation Helper
- **FR-009**: When the technician clicks and holds the microphone button, the system shall use the browser's local SpeechRecognition API (`webkitSpeechRecognition`) in `en-US` to transcribe speech in real-time.
- **FR-010**: When transcription finishes, the system shall insert the transcribed text directly into the chat text entry box to support hands-free message drafting.

### Cloud Vision Audit & Extraction
- **FR-011**: When a photo is uploaded, the system shall invoke a cloud-based Gemini Vision audit agent to verify photo quality (lighting, focus, blur).
- **FR-012**: When the "Fiber Bend Radius" photo is evaluated, the vision agent shall detect if the fiber has a bend limit deviation (tight bend below 30mm).
- **FR-013**: When the "OPM" photo is evaluated, the vision agent shall extract the optical power reading from the meter screen and verify if it falls within the compliant range of `-15 dBm` to `-25 dBm`.
- **FR-014**: When the "Device Label" photo is evaluated, the vision agent shall extract the MAC address and Serial Number from the label.
- **FR-015**: When the "Labeling & Enclosure" photo is evaluated, the vision agent shall confirm that the equipment enclosure is properly closed and labels are clearly legible.

### Conversational Documentation Agent
- **FR-016**: The system shall implement a root orchestrator agent (Google ADK `LlmAgent`) that coordinates conversational text-chat requests in English.
- **FR-017**: The agent shall answer technician questions about failed steps, explain compliance thresholds, and record site comments.
- **FR-018**: When the technician dictates or types a deviation justification (e.g., "fiber cannot be routed differently due to physical cabinet restriction"), the agent shall automatically log the justification for that step, override the block, and mark the step as complete with deviation.

### Installation Report Generation
- **FR-019**: The system shall compile all audit verdicts, extracted serial numbers, OPM readings, coordinates, and logged deviations into a single Markdown-formatted installation report.
- **FR-020**: The system shall provide a download button allowing the technician to save the completed Markdown installation report as a `.md` file locally.

### Work Order & Routes (Simulated)
- **FR-021**: The system shall load simulated route points on a custom canvas showing the technician position, optical splitter hub, and customer pins based on the selected Madrid, Barcelona, or Sevilla work order.

---

## Non-Functional Requirements

### Performance & Latency
- **NFR-001**: The system shall complete the cloud Gemini Vision audit and return the verdict (with quality check and OCR parameters) in under 3.5 seconds from upload completion.
- **NFR-002**: The system shall display the Speech-to-Text transcribed characters in the chat input box with a delay of less than 400ms from the end of speech.

### Reliability & Sync
- **NFR-003**: If a photo upload fails due to temporary network loss, the system shall queue the photo in IndexedDB and retry uploading it automatically when network connection returns.
- **NFR-004**: The system shall ensure that all logged justifications, chat histories, and audit verdicts are persisted locally in IndexedDB, preventing data loss in dead zones.

### Security
- **NFR-005**: All cloud API keys and project settings shall be kept in server-side environment configurations; the client shall make secure REST requests to FastAPI endpoints.

### Usability
- **NFR-006**: The entire user interface, including chat responses, uploader alerts, audit verdicts, and downloadable Markdown reports, shall be in English.
- **NFR-007**: Buttons and tabs shall have touch targets of at least 48×48px.
