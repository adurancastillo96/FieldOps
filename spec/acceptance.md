# Acceptance Criteria

Acceptance criteria per feature, linked to requirements.

## Format
Each criterion follows Given/When/Then:
```
Given [context]
When [action]
Then [expected result]
```

---

## Feature: PWA Installation & Offline Shell

**Requirement**: FR-001

- [ ] **AC-001**: Given the technician opens the app URL in Chrome on Android 10+, when they tap "Add to Home Screen", then the PWA installs and launches in standalone mode with all UI shell assets available offline.
- [ ] **AC-002**: Given the PWA is installed, when the Service Worker activates, then it pre-caches all UI shell files and ONNX model binaries (YOLO11n, PaddleOCR, Whisper-tiny, Gemma 2B) and reports cache readiness via a status indicator.

---

## Feature: Offline Data Capture

**Requirement**: FR-002

- [ ] **AC-003**: Given the device has no network connectivity, when the technician opens the PWA and starts a new inspection, then they can capture photos, record voice commands, and navigate the inspection protocol without any error or degraded functionality.
- [ ] **AC-004**: Given the device is offline, when the technician captures a photo, then the image blob, EXIF metadata, and inspection step context are written to IndexedDB within 200ms.

**Requirement**: FR-003

- [ ] **AC-005**: Given the device was offline and 3 capture payloads are queued in IndexedDB, when network connectivity is restored, then the Background Sync API triggers and all 3 payloads are uploaded to the cloud backend within 60 seconds.
- [ ] **AC-006**: Given a payload upload succeeds (HTTP 200), when the sync callback fires, then the payload is marked as "synced" in IndexedDB and is no longer re-uploaded on subsequent sync events.

**Requirement**: FR-004

- [ ] **AC-007**: Given the technician captures a photo during an inspection, when the capture event fires, then the system persists the JPEG blob, GPS coordinates, UTC timestamp, device orientation, work order ID, and inspection step ID as a structured record in IndexedDB.

---

## Feature: Inspection Workflow Engine

**Requirement**: FR-005

- [ ] **AC-008**: Given the system defines an ONT/ONU inspection protocol with 6 ordered steps (site-overview, ont-before, ont-after-frontal, ont-after-closeup, power-meter, panoramic), when the protocol is loaded, then each step specifies: step name, required evidence types (photo/reading), description text, and whether the step is mandatory or optional.

**Requirement**: FR-006

- [ ] **AC-009**: Given the technician has started an inspection, when they are on step 3 of 6, then the UI displays: the current step name and description, the required evidence type, a progress bar showing "3/6", and visual indicators for completed/pending/current steps.

**Requirement**: FR-007

- [ ] **AC-010**: Given the technician is on a step that requires one photo, when they capture a photo that passes local quality assessment, then the system marks the step as complete and automatically advances the UI to the next step.

**Requirement**: FR-008

- [ ] **AC-011**: Given the technician is on a mandatory step, when they issue a "skip" command, then the system prompts for a justification (voice or text), records the justification in the payload metadata, marks the step as "skipped with justification", and advances to the next step.
- [ ] **AC-012**: Given the technician is on a mandatory step, when they attempt to skip without providing a justification, then the system blocks the skip and displays/announces "Justification required to skip a mandatory step."

---

## Feature: Camera & Photo Quality Assessment

**Requirement**: FR-009

- [ ] **AC-013**: Given the technician taps the camera button on an inspection step, when the camera opens, then the rear camera viewfinder is displayed with a semi-transparent overlay guide showing the expected framing region for the current step (e.g., centered rectangle for close-up, wide frame for panoramic).

**Requirement**: FR-010

- [ ] **AC-014**: Given the technician captures a photo, when the image is saved, then the file includes EXIF metadata with GPS latitude/longitude (4-decimal precision), UTC timestamp (ISO 8601), device orientation (degrees), and a custom field for inspection step ID.

**Requirement**: FR-011

- [ ] **AC-015**: Given the technician captures a photo, when the local ONNX quality model runs, then within 500ms a pass/fail badge appears on the photo thumbnail with scores for: blur (acceptable/unacceptable), exposure (under/ok/over), and framing alignment (aligned/misaligned).
- [ ] **AC-016**: Given a photo scores "pass" on all three quality dimensions, when the badge appears, then it shows a green checkmark and the step can proceed.

**Requirement**: FR-012

- [ ] **AC-017**: Given a photo fails the blur check, when the fail badge appears, then a guidance message displays: "Image is blurry — hold the device steady and ensure adequate lighting."
- [ ] **AC-018**: Given a photo fails the framing check, when the fail badge appears, then a guidance message displays: "Subject not centered — align the device with the overlay guide."

---

## Feature: OCR & Label Reading

**Requirement**: FR-013

- [ ] **AC-019**: Given the technician captures a photo of an ONT label during the "ont-after-closeup" step, when the ONNX OCR model runs, then it extracts and displays candidate values for: MAC address (format XX:XX:XX:XX:XX:XX), serial number, and device model.
- [ ] **AC-020**: Given the ONT label is partially obscured or at an angle, when OCR runs and extraction confidence is below 70%, then the system flags the extraction as "low confidence" and prompts the technician to retake the photo.

**Requirement**: FR-014

- [ ] **AC-021**: Given OCR extracts a MAC address "AA:BB:CC:DD:EE:FF", when the confirmation dialog appears, then the technician can accept the value, manually edit it using an on-screen keyboard, or retake the photo.

**Requirement**: FR-015

- [ ] **AC-022**: Given a barcode is detected on the ONT label, when the barcode is decoded, then its value is compared against the OCR-extracted serial number and any mismatch is flagged with both values shown for technician resolution.

---

## Feature: Voice — Offline Conductor Mode

**Requirement**: FR-016

- [ ] **AC-023**: Given the device is offline and the technician holds the mic button and says "siguiente paso", when Whisper transcribes the audio and Gemma 2B maps the intent, then the PWA navigates to the next inspection step — all processing occurring locally without any network request.

**Requirement**: FR-017

- [ ] **AC-024**: Given the system is in Conductor Mode, when the technician says "tomar foto", then the camera captures a photo and runs local quality assessment.
- [ ] **AC-025**: Given the system is in Conductor Mode, when the technician says "repetir instrucción", then the system re-announces the current step's description via TTS.
- [ ] **AC-026**: Given the system is in Conductor Mode, when the technician says "mostrar resumen", then the system displays a summary of completed and pending steps with pass/fail status.

**Requirement**: FR-018

- [ ] **AC-027**: Given the technician issues a voice command, when the intent is recognized, then within 300ms the UI shows a brief toast notification confirming the action (e.g., "📸 Foto capturada") and plays a confirmation sound.

**Requirement**: FR-019

- [ ] **AC-028**: Given the technician completes a step and advances to the next, when the new step loads, then the browser TTS reads aloud the step description in Spanish (e.g., "Paso 3: Foto de acercamiento del ONT. Capture una foto del frente del dispositivo mostrando la etiqueta completa.").

---

## Feature: Voice — Connected Live Agent

**Requirement**: FR-020

- [ ] **AC-029**: Given the device has network connectivity and the technician taps "Live Agent", when the WebSocket connection is established, then bidirectional audio streaming begins (16kHz PCM uplink, 24kHz PCM downlink) and the agent greets the technician.

**Requirement**: FR-021

- [ ] **AC-030**: Given the live agent session is active, when the technician says "the optical power reading shows minus twenty-three dBm, is that acceptable?", then the agent responds with a voice answer referencing the FTTH knowledge base thresholds and explains whether the value passes or fails.

**Requirement**: FR-022

- [ ] **AC-031**: Given the live agent calls the `display_validation_result` tool which returns `render_command: { layer: 'verdict', action: 'show', data: { status: 'pass', ... } }`, when the frontend receives the functionCall event, then the verdict panel becomes visible and displays the structured result.
- [ ] **AC-032**: Given the live agent calls `navigate_step` with `step_id: 'ont-after-frontal'`, when the frontend receives the render_command, then the inspection workflow UI navigates to the specified step.

**Requirement**: FR-023

- [ ] **AC-033**: Given the technician sends a photo of a bent fiber cable via the live session, when the agent's vision analysis detects the bend radius is below the minimum standard, then the agent responds vocally: "The bend radius appears too tight — it should be at least 30mm. Please re-route the cable with a gentler curve and retake the photo."

**Requirement**: FR-024

- [ ] **AC-034**: Given the live agent session is active and the WebSocket connection drops, when the auto-reconnect fails after 3 attempts (1.5s, 3s, 6s), then the system displays "Connection lost — switching to offline mode" and transitions to Conductor Mode without losing any captured data.

---

## Feature: Cloud Agentic Pipeline

**Requirement**: FR-025

- [ ] **AC-035**: Given a synced capture payload arrives at the backend, when the orchestrator agent receives it, then it routes the payload to the appropriate specialist sub-agents (Photo Quality Auditor, Installation Compliance, OCR Verification) based on the inspection step type.

**Requirement**: FR-026

- [ ] **AC-036**: Given a photo of an ONT installation is sent to the Photo Quality Auditor, when the agent evaluates it, then it returns a JSON verdict: `{ "step_id": "...", "quality": { "blur": "pass"|"fail", "exposure": "pass"|"fail", "framing": "pass"|"fail", "overall": "pass"|"fail" }, "justification": "..." }`.

**Requirement**: FR-027

- [ ] **AC-037**: Given a power meter reading photo shows -23.5 dBm and the knowledge base specifies acceptable range as -8 to -28 dBm for the detected ONT model, when the Installation Compliance agent evaluates, then it returns `{ "optical_power": { "value_dbm": -23.5, "threshold_min": -28, "threshold_max": -8, "verdict": "pass" } }`.
- [ ] **AC-038**: Given a close-up photo shows a fiber cable with a visually estimated bend radius below 30mm, when the Installation Compliance agent evaluates, then it returns a "fail" verdict with justification: "Bend radius below minimum 30mm standard."

**Requirement**: FR-028

- [ ] **AC-039**: Given the edge OCR extracted MAC "AA:BB:CC:DD:EE:FF" and the cloud vision model independently extracts "AA:BB:CC:DD:EE:FF", when the OCR Verification agent compares them, then it returns `{ "match": true, "confidence": "high" }`.
- [ ] **AC-040**: Given the edge OCR extracted MAC "AA:BB:CC:DD:EE:F0" and the cloud extracts "AA:BB:CC:DD:EE:FF", when the agent compares them, then it returns `{ "match": false, "edge_value": "...F0", "cloud_value": "...FF", "recommendation": "manual_review" }`.

**Requirement**: FR-029

- [ ] **AC-041**: Given all sub-agents have returned verdicts for a 6-step ONT inspection, when the orchestrator assembles the final report, then it produces a JSON document containing: `work_order_id`, `technician_id`, `timestamp`, `gps`, `overall_verdict` ("approved"/"rejected"/"review_required"), and a `steps[]` array with per-step sub-verdicts and justifications.

**Requirement**: FR-030

- [ ] **AC-042**: Given the knowledge base directory contains `kb-ftth-optical-standards.txt` and `kb-ftth-installation-rules.txt`, when the backend starts, then these files are loaded and concatenated into the system instructions of all compliance-related agents.

---

## Feature: Grounding & Safety Gates

**Requirement**: FR-031

- [ ] **AC-043**: Given a tool call `navigate_step(step_id='nonexistent_step')` is received, when the before-tool callback validates the argument, then it blocks execution and returns an error: "Invalid step_id: 'nonexistent_step' not in valid steps list."

**Requirement**: FR-032

- [ ] **AC-044**: Given a tool function returns a response without a `render_command` key, when the after-tool callback runs, then it injects a default `render_command: { layer: 'error', action: 'show', message: '...' }` before forwarding.

**Requirement**: FR-033

- [ ] **AC-045**: Given the orchestrator produces a final verdict JSON, when the deterministic policy gate validates it, then it checks: all required fields are present, `optical_power.value_dbm` is a float within -50 to 0 range, `overall_verdict` is one of the three allowed enum values, and at least one step verdict exists.
- [ ] **AC-046**: Given the verdict JSON has `overall_verdict: "approved"` but one step has `quality.overall: "fail"`, when the policy gate checks consistency, then it rejects the verdict with reason: "Inconsistent: overall approved but step X has a failing quality verdict."

**Requirement**: FR-034

- [ ] **AC-047**: Given a verdict fails policy gate validation on the first attempt, when the failure trace is re-injected into the agent context, then the agent produces a corrected verdict on retry and the corrected version passes the gate.
- [ ] **AC-048**: Given a verdict fails policy gate validation on all 3 attempts (1 original + 2 retries), when the final retry fails, then the verdict is persisted with status "error — manual review required" and an alert is logged.

---

## Feature: Persistence & Storage

**Requirement**: FR-035

- [ ] **AC-049**: Given a capture payload with work order "WO-2024-001", step "ont-after-frontal", and timestamp "2024-03-15T10:30:00Z" is synced, when the upload completes, then the image is stored at `gs://{bucket}/WO-2024-001/ont-after-frontal/2024-03-15T10-30-00Z.jpg` and a GCS signed URL is included in the BigQuery verdict record.

**Requirement**: FR-036

- [ ] **AC-050**: Given the orchestrator produces a final verdict for work order "WO-2024-001", when the verdict is ingested into BigQuery, then a row exists in the `inspections` table with partition date "2024-03-15", all verdict fields queryable, and the row includes `technician_id`, `gps_lat`, `gps_lon`, `overall_verdict`, and a JSON column with the full step-level detail.

**Requirement**: FR-037

- [ ] **AC-051**: Given technician "T-042" has completed 3 inspections in zone "North" in the last 24 hours, when the live agent retrieves context, then it loads the last 3 inspection summaries from Firestore and can reference them in conversation (e.g., "Your last inspection at this address was rejected due to a labeling issue.").

---

## Feature: Analytics & Dashboard (Demo)

**Requirement**: FR-038

- [ ] **AC-052**: Given 10 inspection verdicts exist in BigQuery, when the supervisor opens the dashboard view, then they see a table of inspections sortable by date, filterable by technician and verdict status, with green/red/yellow badges for approved/rejected/review_required.

**Requirement**: FR-039

- [ ] **AC-053**: Given the supervisor types "how many inspections failed this week?", when the conversational agent processes the query, then it generates a BigQuery SQL query, executes it, and returns the count with a brief textual summary.

---

## Feature: Work Order Management (Simulated)

**Requirement**: FR-040

- [ ] **AC-054**: Given the mock data source is loaded, when the technician opens the work order list, then at least 3 demo work orders are displayed with: order ID, address, ONT model, and status (pending/in-progress/completed).

**Requirement**: FR-041

- [ ] **AC-055**: Given work order "WO-DEMO-001" specifies ONT model "HG8145V5" with expected MAC prefix "48:8F:4C", when the technician selects this work order and captures an ONT label, then the OCR cross-validation compares the extracted MAC against the expected prefix and flags a mismatch if the prefix doesn't match.

---

## How to Use This File
- Each feature section links to its requirement ID
- Acceptance criteria are checkable — mark ✅ when verified
- Tests should map 1:1 to acceptance criteria
- Update this file when requirements change
