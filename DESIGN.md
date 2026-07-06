# Design — FieldOps

## Problem

FTTH (Fiber-to-the-Home) field technicians install and maintain fiber-optic
infrastructure in environments with poor or no connectivity. Current
documentation processes are manual, error-prone, and unstructured: technicians
take photos on personal phones, fill paper forms, and submit reports hours or
days later. There is no real-time validation of installation quality, no
automated compliance checking against engineering standards, and no structured
capture workflow that ensures all required evidence (photos, measurements,
labels) is collected correctly before the technician leaves the site.

Supervisors and quality engineers lack visibility into field operations until
reports arrive — often with missing photos, incorrect angles, unreadable labels,
or undocumented deviations. Rework costs and audit failures are high.

## Vision

A voice-first, AI-powered field companion that **guides technicians through
structured capture workflows**, **validates installation quality in real-time**,
and **produces auditable structured reports** — all from a smartphone browser
with offline capability.

Success in 2 weeks (hackathon scope):
- A working demo showing a technician capturing an ONT/ONU installation with
  voice guidance, getting real-time AI validation of photo quality and
  compliance, and producing a structured JSON verdict.
- The system works offline for capture and local pre-validation, then syncs
  and runs full cloud audit when connectivity returns.
- Supervisors can query results via natural language ("show failed installs
  this week in zone north").

## Users

- **Field Technician (Primary)**: Works in construction sites, cable ducts,
  building basements. Hands often occupied. Needs voice-first interaction,
  offline capability, step-by-step guided capture, and instant pass/fail
  feedback on their work.
- **Supervisor / Quality Engineer (Secondary)**: Reviews completed inspections,
  tracks quality metrics across teams and zones. Needs structured reports,
  natural-language querying of historical data, and anomaly alerts.

## Scope — V1 (Hackathon Deliverable)

### In-Scope Inspection Scenarios
1. **ONT/ONU Installation Verification**
   - Optical power reading validation (photo of power meter)
   - MAC address / serial number extraction (OCR from device labels)
   - Correct labeling verification
   - Bend radius compliance check (visual AI)
2. **Photo Documentation Workflow**
   - Guided multi-shot capture protocol: before-task, after-task, frontal,
     close-up, panoramic views
   - Real-time photo quality assessment (framing, focus, lighting, angle)
   - AI coaching on how to take a correct photo for compliance
3. **Real-Time Guided Inspection (Connected Mode)**
   - Live voice conversation with the cloud agent for complex validations
   - Agent drives PWA state transitions (ORION `render_command` pattern)
   - Visual inspection of live camera feed for installation compliance

### All 4 Architecture Layers (Demo-Quality)
| Layer | V1 Scope |
|---|---|
| **Edge (PWA)** | Offline capture, local photo pre-validation (ONNX/YOLO), voice command dispatch (Gemma 2B via MediaPipe), Background Sync |
| **Cloud Inference** | Visual quality audit via Gemini Vision (skip dedicated NVIDIA NIM for V1 — use Gemini 1.5 Flash multimodal directly) |
| **Agentic Cognitive** | Google ADK orchestrator + specialist sub-agents, RAG with FTTH knowledge base, structured JSON verdicts |
| **Persistence & Analytics** | GCS for images, BigQuery for verdicts, conversational analytics agent (demo) |

### Simulated / Mock Data
- Work orders: hardcoded demo data (like ORION's `_PATIENT_DATA`)
- Corporate systems (OSS/BSS): mock tool responses
- FTTH standards: static knowledge base files (like JohnKeats-AI's `kb-*.txt`)

## Constraints

### Technical
- **Language**: Python 3.11+ (backend), Vanilla JS (frontend PWA)
- **Agent Framework**: Google ADK (`google-adk`)
- **Model**: Gemini 2.5 Flash (Native Audio Dialog for live voice, standard for vision/text)
- **Frontend**: Progressive Web App — no app store dependency. Must work on
  Chrome mobile (Android 10+). Offline-first via Service Workers + IndexedDB.
- **Deployment**: Docker → Google Cloud Run (like both reference projects)
- **Real-time Transport**: WebSocket (bidirectional audio + JSON commands)
- **Edge AI**: ONNX Runtime Web (WASM/WebGPU) for local inference models
- **Offline voice**: Gemma 2B via MediaPipe LLM Inference API (WebGPU)
- **Performance**: Local inference < 500ms per frame. Cloud round-trip < 3s.

### Business
- **Timeline**: ~2 weeks (hackathon)
- **Budget**: GCP free tier + hackathon credits
- **Regulations**: Photo evidence must be timestamped and geotagged.
  All PII handling follows JohnKeats-AI's anonymisation patterns.

### UX
- **Voice-first**: Primary interaction modality in the field
- **Gloved hands**: UI must work with large touch targets, minimal typing
- **Noisy environments**: Whisper-Web for robust transcription
- **Low-end devices**: Must work on mid-range Android smartphones (4GB RAM)
- **Language**: Spanish (primary), English (secondary). UI labels bilingual.

## Non-Goals (Explicit)

- We will NOT build a dedicated NVIDIA NIM inference layer in V1 — Gemini
  multimodal handles both vision and language. NIM/DINOv2 is an evolution path.
- We will NOT integrate with real OSS/BSS or provisioning systems — mock data.
- We will NOT implement the full distillation/TAO pipeline — use pre-trained
  YOLO11n and Whisper-tiny ONNX models directly.
- We will NOT build a native mobile app — PWA only.
- We will NOT implement the full A2A protocol for analytics agents — simplified
  conversational BigQuery agent for the demo.
- We will NOT cover fiber splice verification, NAP inspection, or drop cable
  installation in V1 — ONT/ONU installation + photo documentation only.
- We will NOT implement the adversarial PII anonymisation pipeline from
  JohnKeats-AI in V1 — basic PII handling only.

## Interaction Model — Hybrid Voice Architecture

### Offline Mode (Conductor Mode)
- Local Gemma 2B (via MediaPipe WebGPU) acts as a **command dispatcher**
- Technician issues short voice commands: "foto tomada", "siguiente paso",
  "validar instalación", "repetir foto"
- SLM maps commands to PWA state transitions (no network calls)
- All captures stored in IndexedDB with metadata, queued for cloud sync

### Connected Mode (Live Agent)
- Full bidirectional live conversation via WebSocket (ORION pattern)
- Cloud agent (Gemini 2.5 Flash Native Audio) provides:
  - Real-time photo quality coaching ("the label is not readable, move closer")
  - Installation compliance guidance ("the bend radius looks too tight")
  - Step-by-step inspection protocol narration
- Agent drives PWA UI via `render_command` protocol (showing/hiding panels,
  navigating inspection steps, displaying validation results)

### Sync Transition
- When connectivity is recovered, Background Sync API uploads queued payloads
- Cloud pipeline processes backlogged captures asynchronously
- Results sync back to PWA for technician review

## Key Patterns from Reference Projects

### From ORION (Live Agents + UI Navigation)
- `render_command` protocol — tools return structured UI commands
- Dual-phase UI update (optimistic on `functionCall`, data on `functionResponse`)
- Multi-agent hierarchy with LLM-driven routing via `transfer_to_agent()`
- Before/after tool callbacks for argument validation (grounding)
- WebSocket lifecycle with `LiveRequestQueue` + `run_live()`
- Vanilla JS IIFE modules for frontend
- Tool docstrings as LLM instructions

### From JohnKeats-AI (Technical Execution & Agent Architecture)
- Prompts as external markdown files + `load_prompt()` loader
- Knowledge base as static files concatenated into system prompt
- Deterministic policy gates (pure Python, no LLM) for safety boundaries
- Structured JSON output schemas on every LLM call
- Firestore for session persistence and memory
- Clean separation: live agent independent of batch pipeline
- Schema-driven tool functions with rich docstrings

## Design References

- ORION Architecture: `reference/orion/Gemini_LiveAPI_Hackathon_Architecture.png`
- ORION Workflow: `reference/orion/Gemini_LiveAPI_Hackathon_Workflow.png`
- JohnKeats-AI Architecture: `reference/johnkeats-ai/docs/architecture.png`
- IDEA.md (full technical report): `.agents/IDEA.md`
