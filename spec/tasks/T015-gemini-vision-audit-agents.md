# T015 — Gemini Vision Compliance & Quality Auditing Agents

## Status
- [ ] Pending  /  [ ] In Progress  /  [ ] Completed

## Description
Configure Google ADK specialized agents (Photo Quality Auditor and Installation Compliance Advisor) using standard Gemini (`gemini-2.5-flash`) models to analyze static step photos. Define system prompts and engineering rules to check bend radius tightness, OPM value displays (within -15dBm to -25dBm range), ONT labels, and enclosure packaging.

## Acceptance Criteria (DoD)
- **Specialized Auditing agents**:
  - Photo Quality Auditor: returns verdicts for focus, blur, and lighting.
  - Installation Compliance Advisor: returns verdicts for fiber bend safety, OPM readings (fails if outside -15dBm to -25dBm range), MAC address/serial number label OCR extraction, and closed enclosure validation.
- **Structured Schema output**:
  - The agents return structured JSON verdicts matching Pydantic formats.

## Scope
- Modify: `src/agents/quality_auditor.py` (Adapt instructions and prompt interfaces to receive uploaded image payloads)
- Modify: `src/agents/compliance_advisor.py` (Define compliance checks and expected value extractions)
- Modify: `src/agents/orchestrator.py` (Connect the uploader pipeline to these agents)

## Constraints
- Engineering standards must be read from the knowledge base and injected into the agent system instructions.
