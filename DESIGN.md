# Design — FieldOps FTTH Photo Audit & Documentation Assistant

## Problem
FTTH (Fiber-to-the-Home) installation documentation is heavily dependent on photo evidence (vitals, bend radii, device serial numbers, and equipment labels). Currently, field technicians capture these photos manually but have no way of verifying their compliance or quality in the field. When they return to the office, missing, blurry, or non-compliant photos lead to failed audits, expensive re-work, and project delays.

## Vision
A clean, responsive, English-first web application that guides technicians through capturing and uploading FTTH deployment photos step-by-step. Instead of real-time streaming audio and video, the application uses **static file uploads** (photos) which are automatically analyzed by a cloud-based Gemini Vision audit pipeline. An interactive text-based assistant helps the technician log any site anomalies, draft notes, and generate a final, downloadable Markdown installation report before leaving the site.

## Users
* **Field Technician**: Uploads installation photos at each step, receives immediate automated audit feedback, and discusses site-specific deviations with the AI agent via text chat.
* **Quality Supervisor**: Accesses the final generated documentation, checks the verified audit results, and reviews the final installation report.

## Scope (New Cycle)
### 1. Guided Photo Audit Pipeline
* **Step-by-step upload walkthrough**:
  1. **Fiber Bend Radius**: Validate that optical fiber bends are compliant and not pinched.
  2. **Optical Power Meter (OPM)**: Perform OCR and validation on the power level displayed on the power meter screen (e.g. within -15dBm to -25dBm range).
  3. **Device Label (ONT/ONU)**: Extract MAC address and Serial Number from the label photo.
  4. **Labeling & Enclosure**: Verify correct label print, text format, and enclosure closing.
* **Instant Cloud Audit**: On photo upload, the backend triggers a Gemini Vision analysis that checks focus/lighting, compliance parameters, and OCR data, returning a structured pass/fail verdict with actionable coaching feedback.

### 2. Conversational Documentation Assistant
* **Left-Pane Chat Thread**: A text-only chat interface (English) where the technician can chat with the assistant.
* **Hands-Free Dictation**: The microphone button acts as a local browser-based Speech-to-Text utility, populating the chat entry box for voice-assisted typing.
* **Agent Capabilities**: 
  - Explains failed audit steps and provides remediation advice.
  - Allows the technician to log deviations ("Fiber has an existing bend limitation due to physical space constraints").
  - Collects customer notes and logs equipment serial overrides.
  - Dynamically updates the inspection checklist and route details.

### 3. Reporting & Visualization
* **Right-Pane Multipurpose View**:
  - **Camera / Upload Tab**: Handles file uploader drops or direct camera captures per step.
  - **Captured Photo Tab**: Displays the active step's photo and its detailed compliance markers.
  - **Route Map Tab**: Displays Madrid/Barcelona/Sevilla deployment paths and technician locations.
  - **Audit Verdicts Tab**: Shows the structured pass/fail metrics, extracted OCR strings, and OPM readings.
  - **Markdown Report Tab**: Shows a live preview draft of the installation report and a "Download Markdown Report" button.

## Key Patterns from Reference Projects
* **From NagarDrishti (Civic complaint audit)**:
  - 4-stage verification and trust score calculation for uploaded evidence.
  - Generation of structured PDF reports (using ReportLab or direct Markdown-to-PDF conversion) with embedded photo attachments, GPS locations, and audit comments.
* **From Ekaette (Multimodal grading and chat)**:
  - Vision Agent with structured JSON output schema mapping condition grades.
  - Text-based multi-agent routing where a router delegates details to specialized vision or booking/report agents.
* **From Orion (UI Navigation & check-lists)**:
  - Step-based progress tracking and UI rendering command updates (shifting step visibility based on current progress).

## Non-Goals
* No bidirectional WebSocket audio streaming or local microphone recording.
* No continuous 1 fps live canvas video feed streaming.
* No integration with live production OSS/BSS platforms.
