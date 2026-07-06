# Requirements — EARS Notation

Requirements written in Easy Approach to Requirements Syntax (EARS).

## EARS Patterns Reference
- **Ubiquitous**: The [system] shall [action]
- **Event-driven**: When [event], the [system] shall [action]
- **State-driven**: While [state], the [system] shall [action]
- **Optional**: Where [condition], the [system] shall [action]
- **Unwanted**: If [unwanted condition], the [system] shall [action]

---

## Functional Requirements

### PWA Shell & Offline Core

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-001 | The system shall provide a Progressive Web App installable on Chrome mobile (Android 10+) with a Service Worker that caches the UI shell and ONNX model binaries using a Cache-First strategy. | Must | Draft |
| FR-002 | While the device has no network connectivity, the system shall allow the technician to perform all capture and local pre-validation workflows using data stored in IndexedDB. | Must | Draft |
| FR-003 | When network connectivity is recovered, the system shall automatically upload all queued capture payloads (images, audio, metadata) to the cloud via the Background Sync API. | Must | Draft |
| FR-004 | The system shall persist all captured media (JPEG images, audio blobs) and structured metadata (timestamps, GPS coordinates, work order ID, inspection step) in IndexedDB until confirmed synced. | Must | Draft |

### Inspection Workflow Engine

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-005 | The system shall define a configurable multi-step inspection protocol for ONT/ONU installations, comprising ordered steps with required evidence types per step (e.g., before-photo, close-up, panoramic, power-meter reading). | Must | Draft |
| FR-006 | When the technician initiates an inspection, the system shall display the current step, required evidence, and progress through the protocol. | Must | Draft |
| FR-007 | When the technician completes all required evidence for a step, the system shall advance to the next step and update the progress indicator. | Must | Draft |
| FR-008 | The system shall prevent skipping mandatory steps unless the technician provides a voice or text justification for the skip, which is recorded in the payload metadata. | Should | Draft |

### Camera & Photo Capture

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-009 | The system shall access the device rear camera via the MediaDevices API and display a live viewfinder with overlay guides indicating the expected framing for the current inspection step. | Must | Draft |
| FR-010 | When the technician captures a photo, the system shall embed EXIF metadata including GPS coordinates, UTC timestamp, device orientation, and the inspection step ID. | Must | Draft |
| FR-011 | When a photo is captured, the system shall run a local ONNX-based quality assessment (blur detection, exposure, framing alignment) and display a pass/fail indicator within 500ms. | Must | Draft |
| FR-012 | When the local quality assessment fails, the system shall display specific remediation guidance (e.g., "Image too dark — increase lighting or enable flash"). | Should | Draft |

### OCR & Label Reading (Edge AI)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-013 | When a photo of an ONT/ONU device label is captured, the system shall run local OCR (PaddleOCR via ONNX) to extract the MAC address, serial number, and model identifier. | Must | Draft |
| FR-014 | When OCR extraction succeeds, the system shall display the extracted values for technician confirmation or manual correction before committing to the payload. | Must | Draft |
| FR-015 | Where a barcode or QR code is present on the device label, the system shall decode it and cross-reference against the extracted OCR values. | Should | Draft |

### Voice Interaction — Offline (Conductor Mode)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-016 | While the device is offline, the system shall process voice commands locally using Whisper-Web (WASM) for transcription and Gemma 2B (MediaPipe LLM, WebGPU) for intent mapping. | Must | Draft |
| FR-017 | The system shall recognize and execute at minimum these voice command intents: capture photo, next step, previous step, repeat instruction, validate current step, skip step with justification, and show summary. | Must | Draft |
| FR-018 | When a voice command is recognized, the system shall provide audio and visual feedback confirming the action taken within 300ms of intent resolution. | Should | Draft |
| FR-019 | While in Conductor Mode, the system shall announce each new inspection step audibly using the browser SpeechSynthesis API (TTS). | Should | Draft |

### Voice Interaction — Connected (Live Agent)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-020 | When the device has network connectivity, the system shall establish a WebSocket connection to the cloud backend and stream bidirectional PCM audio to the Gemini 2.5 Flash Native Audio Dialog model via Google ADK `LiveRequestQueue`. | Must | Draft |
| FR-021 | While in connected Live Agent mode, the technician shall be able to have a natural conversation with the cloud agent for real-time guided inspection, photo quality coaching, and compliance questions. | Must | Draft |
| FR-022 | When the cloud agent calls a tool, the system shall update the PWA UI according to the `render_command` returned by the tool (show/hide panels, navigate steps, display validation results). | Must | Draft |
| FR-023 | When the live agent detects a compliance issue in a captured photo (e.g., unreadable label, excessive bend radius), it shall provide specific voice guidance on how to retake or correct the capture. | Must | Draft |
| FR-024 | When the WebSocket connection is lost during a live session, the system shall gracefully fall back to Conductor Mode and queue all pending captures for later cloud processing. | Must | Draft |

### Cloud Agentic Pipeline (Cognitive Layer)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-025 | The system shall implement a root orchestrator agent (Google ADK `LlmAgent`) that receives synced capture payloads and routes them to specialist sub-agents for validation. | Must | Draft |
| FR-026 | The system shall implement a Photo Quality Auditor sub-agent that evaluates each image against documentation standards (framing, focus, lighting, required content visible) using Gemini vision and returns a structured JSON verdict. | Must | Draft |
| FR-027 | The system shall implement an Installation Compliance sub-agent that evaluates ONT/ONU installation evidence against FTTH engineering standards loaded from the knowledge base (optical power thresholds, bend radius limits, labeling requirements) and returns a structured JSON verdict. | Must | Draft |
| FR-028 | The system shall implement an OCR Verification sub-agent that cross-validates edge-extracted OCR values against the cloud vision model's independent extraction, flagging discrepancies. | Should | Draft |
| FR-029 | When all sub-agent verdicts are collected for an inspection, the orchestrator shall produce a final structured JSON report containing: overall pass/fail, per-step verdicts with justifications, extracted data fields, and any flagged anomalies. | Must | Draft |
| FR-030 | The system shall load FTTH engineering standards and compliance rules from static knowledge base files (`.txt`/`.md`) concatenated into agent system prompts at startup. | Must | Draft |

### Grounding & Safety Gates

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-031 | The system shall implement before-tool callbacks that validate all tool arguments against whitelists of valid inspection steps, evidence types, and command parameters before execution. | Must | Draft |
| FR-032 | The system shall implement after-tool callbacks that verify every tool response contains a valid `render_command` structure before forwarding to the client. | Must | Draft |
| FR-033 | The system shall implement deterministic policy gates (pure Python, no LLM) that enforce: verdict JSON schema compliance, optical power value range assertions, and mandatory field presence in final reports. | Must | Draft |
| FR-034 | If the cloud agent produces a verdict that fails schema validation or policy gate checks, the system shall block the verdict from persistence, log the failure trace, and re-inject it into the agent's context for self-correction (max 2 retries). | Should | Draft |

### Persistence & Storage

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-035 | When a capture payload is synced from the edge, the system shall upload the original HD images to a Google Cloud Storage bucket with a structured path: `gs://{bucket}/{work_order_id}/{step_id}/{timestamp}.jpg`. | Must | Draft |
| FR-036 | When the orchestrator produces a final inspection report, the system shall ingest the structured JSON verdict into a BigQuery table partitioned by inspection date, including all extracted fields, GPS coordinates, and verdict details. | Must | Draft |
| FR-037 | The system shall store per-technician session history in Firestore, enabling retrieval of recent inspections for context (last 5 inspections in the same geographic zone). | Should | Draft |

### Analytics & Conversational Query (Demo)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-038 | The system shall provide a supervisor web view that displays a dashboard of recent inspections with pass/fail status, filterable by technician, zone, and date range. | Should | Draft |
| FR-039 | The system shall implement a conversational analytics agent that translates natural-language queries (e.g., "show failed inspections this week in zone north") into BigQuery SQL and returns tabular or summary results. | Could | Draft |

### Work Order Management (Simulated)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-040 | The system shall provide a mock work order data source containing at least 3 demo work orders with pre-populated fields: order ID, address, ONT model, expected MAC prefix, assigned technician, and required inspection steps. | Must | Draft |
| FR-041 | When the technician selects a work order, the system shall load the corresponding inspection protocol and pre-fill expected values for OCR cross-validation. | Must | Draft |

---

## Non-Functional Requirements

### Performance

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| NFR-001 | The system shall complete local ONNX inference (photo quality + OCR) in under 500ms on a mid-range Android device (Snapdragon 6-series, 4GB RAM). | Must | Draft |
| NFR-002 | The system shall complete local voice command recognition and intent mapping (Whisper + Gemma 2B) in under 2 seconds per utterance. | Must | Draft |
| NFR-003 | While in connected mode, the system shall deliver cloud agent responses (voice + render_command) within 3 seconds of the technician's utterance completing. | Should | Draft |
| NFR-004 | The system shall buffer outgoing audio in chunks of at least 3200 bytes (~100ms at 16kHz) before forwarding over WebSocket to minimize network overhead. | Should | Draft |

### Reliability

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| NFR-005 | The system shall not lose any captured data during connectivity transitions (online → offline → online). All captures must persist in IndexedDB until confirmed uploaded. | Must | Draft |
| NFR-006 | If the WebSocket connection drops, the system shall attempt auto-reconnection with exponential backoff (max 3 retries, starting at 1.5s) before falling back to offline mode. | Must | Draft |
| NFR-007 | The cloud agentic pipeline shall retry failed LLM calls up to 2 times with exponential backoff before marking a verdict as "error — manual review required". | Should | Draft |

### Security

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| NFR-008 | The system shall not store API keys, model credentials, or cloud secrets in client-side code or IndexedDB. All cloud authentication shall use server-side environment variables. | Must | Draft |
| NFR-009 | The system shall geolocate captures using the Geolocation API and embed coordinates in metadata, but shall not transmit or store raw GPS data beyond the required precision for zone-level analytics (4 decimal places). | Should | Draft |
| NFR-010 | The system shall validate all incoming WebSocket messages against expected schemas before processing. | Must | Draft |

### Usability

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| NFR-011 | The system shall render all UI elements with touch targets of at least 48×48dp, suitable for gloved-hand operation. | Must | Draft |
| NFR-012 | The system shall support Spanish as the primary UI and voice language, with English as a secondary option. | Must | Draft |
| NFR-013 | The system shall provide visual and haptic feedback on every user action (photo capture, step completion, voice command recognized). | Should | Draft |

### Scalability & Deployment

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| NFR-014 | The backend shall deploy as a single containerized service on Google Cloud Run with at minimum 2Gi RAM and 3600s WebSocket timeout. | Must | Draft |
| NFR-015 | The system shall use a CI/CD pipeline (Cloud Build) for automated Docker build, Artifact Registry push, and Cloud Run deployment. | Should | Draft |

### Observability

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| NFR-016 | The system shall log every agent tool call, tool response, and verdict decision with timestamps to enable audit trail reconstruction. | Must | Draft |
| NFR-017 | The system shall track and log token consumption per cloud agent invocation for cost monitoring. | Should | Draft |

---

## How to Use This File
- Write requirements using EARS patterns for consistency
- Every requirement must have a unique ID
- Priority follows MoSCoW: Must, Should, Could, Won't
- Status: Draft → Reviewed → Approved → Implemented → Verified
- Link requirements to acceptance criteria in `acceptance.md`
