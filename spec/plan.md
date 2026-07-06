# Technical Plan

Generated in Phase 2 of the SDD cycle by the architect agent.

## Overview
The technical implementation follows a modular progression, prioritizing the Edge PWA capability and offline workflow first, followed by the real-time backend agentic pipeline, safety validation rules, persistence layers, and analytics.

## Components

| Component | Description | Dependencies | Complexity |
|-----------|-------------|--------------|------------|
| Setup & Scaffold | Establish backend FastAPI structure, Hatch config, frontend static shell | None | Low |
| PWA Core & DB | Build offline-first PWA, IndexedDB storage engine, Service Worker caching | Setup & Scaffold | Medium |
| Local Edge AI | Integrate ONNX Runtime Web (blur/exposure/PaddleOCR) and Web Speech API | PWA Core & DB | High |
| REST API Sync | Build REST API endpoints for mock work orders and background payload synchronization | Setup & Scaffold | Low |
| ADK & WebSocket | Implement real-time WebSocket connection to Gemini Live Native Audio via Google ADK | Setup & Scaffold | High |
| Orchestrator & Sub-agents | Define the Root Orchestrator and specialist sub-agents (Quality, Compliance, OCR) | ADK & WebSocket | Medium |
| Grounding & Safety Gates | Build callbacks, Pydantic validation gates, and LLM self-correction logic | Orchestrator & Sub-agents | Medium |
| Cloud Persistence | Integrate GCS image upload, BigQuery ingestion, and Firestore session history | REST API Sync, Safety Gates | Medium |
| Analytics & Dashboard | Develop supervisor view and conversational analytics agent for BigQuery querying | Cloud Persistence | Medium |

## Implementation Order

1. **Setup & Scaffold**: Establish workspace environment. Initialize files, virtual environments, configurations, and core structures.
2. **PWA Core & Offline Storage**: Build IndexedDB service and step-by-step workflow navigation engine, enabling capture operations offline.
3. **REST API Gateway**: Expose FastAPI mock work orders endpoint and sync sync endpoint to receive payloads.
4. **Local Edge AI**: Package ONNX models for blur/exposure assessment and OCR. Implement local speech command parsing for offline voice conduction.
5. **WebSocket & ADK Setup**: Construct bidirectional audio and JSON websocket pipeline to run the Live Agent conversation.
6. **Orchestrator & Sub-Agents**: Configure Google ADK agent roles, tool registrations, and instructions concatenated with static KB files.
7. **Grounding & Safety Gates**: Program before/after tool callback hooks and deterministic python verification policy gates.
8. **Cloud Persistence**: Link GCS, BigQuery, and Firestore database services with IAM credentials.
9. **Supervisor Analytics**: Add dashboard panel and natural language to SQL analytics agent.
10. **Testing & Validation**: Author unit tests for PWA and backend, execute test suites, and execute code reviews.

## Technical Decisions

| Decision | Choice | Rationale | Alternatives Considered |
|----------|--------|-----------|------------------------|
| Frontend Framework | Vanilla JS (IIFE modules) | Zero-build simplicity, maximum control over WASM/WebGPU compilation, fast load times. | React/Vite (adds build step and bundle weight) |
| Cloud Vision Engine | Gemini 1.5 Flash Vision | Direct multimodal integration, lower pipeline complexity for V1, flexible grounding. | NVIDIA NIM (DINOv2) on GKE (Deferred to Phase 2) |
| Audio Format | 16kHz Mono Input, 24kHz Mono Output | Required by Vertex AI Live API / Native Audio specifications, balances bandwidth. | Opus compression (adds client/server codec burden) |
| State Management | PWA client-side step engine | Prevents workflow loss on connection drop, ensures offline parity. | Server-driven workflow state (requires constant connectivity) |

## Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Edge AI WASM memory limits | High | Medium | Use quantized lightweight models (YOLO11n, Whisper-tiny) and test memory allocation limits in Android browsers. |
| High voice loop latency | Medium | Medium | Buffer audio to 100ms chunks, leverage Gemini 2.5 Flash Native Audio direct dialog (avoid cascade of TTS/STT steps). |
| Grounding failure / hallucinations | High | Low | Implement before-tool whitelist callbacks and Pydantic validation schemas to catch and self-correct invalid agent arguments. |
| Background Sync fail due to OS sleeping | Medium | High | Persist records locally inside IndexedDB indefinitely. Implement an manual retry sync button in PWA UI. |

## Estimated Effort

| Phase | Estimate | Notes |
|-------|----------|-------|
| Setup & Scaffold | 1 day | Directory initialization, dependency pinning, workspace configs. |
| Edge PWA & Local AI | 4 days | Service workers, IndexedDB cache, camera controls, local ONNX runtimes. |
| Backend & WebSocket | 3 days | FastAPI WebSocket loops, ADK LiveRequestQueue integrations. |
| Multi-agent & Safety Gates | 3 days | Orchestrator definitions, sub-agent logic, Pydantic gate checks. |
| Persistent DB & Analytics | 2 days | GCS storage, BigQuery table partition schema, Firestore history. |
| Testing & Verification | 2 days | Integration tests, code formatting, security reviews. |
