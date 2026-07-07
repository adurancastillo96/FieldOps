# Acceptance Criteria (New Cycle)

Acceptance criteria per feature, linked to requirements.

## Format
Each criterion follows Given/When/Then:
```
Given [context]
When [action]
Then [expected result]
```

---

## Feature: PWA Shell & Layout Core

**Requirements**: FR-001, FR-002, FR-003
- **AC-001**: Given the PWA is loaded, when the UI renders, then it splits the screen into a left-hand column (width `420px`) for chat logging and entry, and a right-hand column for visual tabs (Camera/Upload, Photo Preview, Route Map, Audit Verdicts, Markdown Report).
- **AC-002**: Given any UI element, label, system prompt, or agent chat reply, when it is rendered or spoken, then the language used is strictly English (`en-US`).

---

## Feature: Step-by-Step Guided Photo Uploader

**Requirements**: FR-004, FR-005, FR-006
- **AC-003**: Given the technician starts an installation walkthrough, when they are on Step 1, then the UI displays the required evidence description for "Fiber Bend Radius".
- **AC-004**: Given a photo is uploaded for the current step, when the cloud audit finishes, then a pass/fail/review verdict badge is immediately shown in the "Audit Verdicts" tab.
- **AC-005**: Given a step has a failing audit verdict, when the technician attempts to click "Next Step", then the UI blocks navigation and prompts the technician to either re-upload a photo or type a justification in the chat to override.

---

## Feature: Camera & Static Photo Uploads

**Requirements**: FR-007, FR-008
- **AC-006**: Given the uploader interface, when the technician clicks "Browse File" or drags a photo into the uploader zone, then the system loads the file and shows its preview.
- **AC-007**: Given a photo is uploaded, when it is processed, then the system automatically captures the device timestamp and current simulated GPS coordinates (Madrid/Barcelona/Sevilla) and binds them to the upload payload.

---

## Feature: Browser Voice Dictation Helper

**Requirements**: FR-009, FR-010
- **AC-008**: Given the technician clicks and holds the microphone button, when they speak in English, then the browser SpeechRecognition API transcribes their voice locally and prints words dynamically into the text input box.

---

## Feature: Cloud Vision Audit & Extraction

**Requirements**: FR-011, FR-012, FR-013, FR-014, FR-015
- **AC-009**: Given a photo is uploaded, when the backend Gemini Vision audit runs, then it returns a structured JSON payload detailing focus, exposure, and blur.
- **AC-010**: Given a photo of the OPM is uploaded displaying `-18.5 dBm`, when the compliance check runs, then the extracted reading is validated as within the `-15 dBm` to `-25 dBm` range, resulting in a passing verdict.
- **AC-011**: Given a photo of the ONT device label is uploaded, when the Vision audit runs, then it extracts the MAC address and Serial Number and displays them in the "Audit Verdicts" tab.

---

## Feature: Conversational Documentation Agent

**Requirements**: FR-016, FR-017, FR-018
- **AC-012**: Given a failed step, when the technician asks the agent "how do I fix this?", then the agent provides instructions in English to correct the cabling or camera focus.
- **AC-013**: Given the technician types "the fiber has a slight bend because the plastic frame is too narrow, overriding this step", when the agent parses this message, then it logs this justification, overrides the step restriction, and marks the step as completed.

---

## Feature: Installation Report Generation

**Requirements**: FR-019, FR-020
- **AC-014**: Given the technician has completed or justified all 4 steps, when they focus on the "Markdown Report" tab, then a clean, formatted Markdown report compiles displaying all details, serial numbers, coordinates, and justifications.
- **AC-015**: Given the Markdown report is generated, when the technician clicks "Download Markdown Report", then the browser triggers a local file download saving the report as `installation_report_{work_order_id}.md` to their device.

---

## Feature: Work Order & Routes

**Requirement**: FR-021
- **AC-016**: Given a work order in Madrid is selected, when the "Route Map" tab is focused, then the canvas renders a route indicating Madrid coordinates, connecting lines, technician markers, and central optical hubs.
