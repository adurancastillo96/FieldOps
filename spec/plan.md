# Technical Plan (New Cycle)

Generated in Phase 2 of the SDD cycle by the architect agent.

## Overview
The implementation transitions the application from a WebSocket-based streaming co-pilot to a stateless, RESTful, guided photo audit and documentation companion. It focuses on guided photo uploads, automated cloud vision compliance auditing (via Gemini 2.5 Flash), local speech-to-text dictation, and direct browser-based Markdown report generation.

## Components

| Component | Description | Dependencies | Complexity |
|-----------|-------------|--------------|------------|
| Claude Layout Redesign | Establish the split layout: left-side conversational feed (text-only + speech-to-text input), right-side guided tabs. | None | Low |
| Speech Dictation | Implement local browser-based `webkitSpeechRecognition` to dictate chat entries hands-free. | None | Medium |
| REST Upload API | Build a FastAPI endpoint to upload step photos, save to GCS, and trigger vision audits. | None | Medium |
| REST Chat & Agents | Build a chat endpoint using standard ADK Orchestrator and Vision Auditor sub-agents (Quality + Compliance). | REST Upload API | High |
| Report Generator | Build Markdown compiler and download trigger in the frontend and backend. | REST Chat & Agents | Low |
| Verification Tests | Verify image analysis prompts, OCR outputs, MAC prefix checks, and Markdown generation. | Setup | Medium |

## Implementation Order

1. **Claude UI Redesign**: Re-arrange `index.html` and `styles.css` to represent the English-only dual-pane layout with tabs for Camera/Upload, Photo Preview, Route Map, Audit Verdicts, and Markdown Report.
2. **Speech Dictation Helper**: Bind the microphone button to browser-based `webkitSpeechRecognition`, appending transcriptions directly to the text input box.
3. **REST Upload & Audit Endpoint**: Implement `POST /api/v1/work-orders/{id}/upload`. It accepts the step photo, saves it to mock/local storage (or GCS), and triggers the ADK audit pipeline.
4. **Agent Cognitive Refactoring**: Update `orchestrator.py`, `quality_auditor.py`, and `compliance_advisor.py` to evaluate static step photos via the standard Gemini API and return structured JSON verdicts.
5. **REST Chat Endpoint**: Implement `POST /api/v1/work-orders/{id}/chat` where the technician can text-chat with the orchestrator to log deviations or ask questions.
6. **Markdown Report Download**: Update the PWA to compile inspection metadata and verdicts into a structured Markdown document and trigger direct local downloads.
7. **Verification**: Create unit tests verifying REST uploader, vision audits, OCR extraction, and deviation overrides.

## Technical Decisions

| Decision | Choice | Rationale | Alternatives Considered |
|----------|--------|-----------|------------------------|
| Communication Protocol | HTTPS REST (POST/GET) | Highly reliable on patchy networks, avoids WebSocket handshake overhead and connection drops. | WebSockets (adds stateful connection complexity) |
| Voice Input | Web Speech API | Local browser-based transcription avoids uploading raw audio packets, saving bandwidth and cloud transit latency. | Whisper ONNX Web / Cloud Whisper API |
| Report Output | Downloadable Markdown | Simple, text-based, readable on all platforms, easily parsed, zero server-side rendering burden. | ReportLab PDF (adds dependency bloat) |

## Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Cloud Vision Audit Latency | Medium | Medium | Perform visual checks concurrently and keep Gemini instructions short to ensure response returns under 3.5s. |
| Network Outage during Upload | High | Medium | Store photo payloads locally in IndexedDB and allow the technician to manually trigger upload retries when back online. |
