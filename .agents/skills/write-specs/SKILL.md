---
name: write-specs
description: >
  Use me to turn a raw user idea into a rigorous technical specification.
  I act as the Architect: I fill in spec/requirements.md, spec/ARCHITECTURE.md,
  spec/plan.md and spec/acceptance.md in sequence — then pause for human approval
  before any further action. Activate by name or with /write-specs.
tools: [Read, Write]
---

# Skill: Write Specs

Orchestrate the SDD **Phase 0 → Phase 1 → Phase 2** spec artefacts by populating
the existing `spec/` templates from a raw idea. Never invent new output files;
always write into the canonical templates the project already owns.

## SDD Phases covered

| Phase | Output file | Purpose |
|---|---|---|
| 0 – Design | *(chat only)* | Clarify problem, users, constraints |
| 1 – Specification | `spec/requirements.md` + `spec/acceptance.md` | EARS requirements + Given/When/Then criteria |
| 2 – Technical Plan | `spec/ARCHITECTURE.md` + `spec/plan.md` | Architecture, tech stack, components, risks |

---

## Steps

### Step 1 — Understand the idea (Phase 0)
1. Read any files the user references (notes, existing specs, README).
2. Re-state the problem in one sentence and confirm with the user if uncertain.
3. Identify: primary users, core actions, success criteria, hard constraints.
4. Surface every ambiguity as an explicit assumption (document it; don't invent).

> ⚠️ If there is critical ambiguity that cannot be assumed: **stop and ask**
> before writing anything.

---

### Step 2 — Populate `spec/requirements.md` (Phase 1a)
1. Read the current `spec/requirements.md` to understand the existing template
   format and any rows that may already exist.
2. Fill in / replace placeholder rows following the existing table structure:
   - Use EARS notation for every requirement
     (`When X, the system shall Y` / `The system shall Y` / etc.)
   - Assign sequential IDs (`FR-001`, `NFR-001`, …)
   - Set `Priority` using MoSCoW (Must / Should / Could / Won't)
   - Set `Status` to `Draft`
3. Write the updated file back to `spec/requirements.md`.

---

### Step 3 — Populate `spec/acceptance.md` (Phase 1b)
1. Read `spec/acceptance.md`.
2. For each functional requirement added in Step 2, add a feature section with
   at least one `Given / When / Then` criterion linked to the FR ID.
3. Write the updated file back to `spec/acceptance.md`.

---

### Step 4 — Halt for Phase 1 approval ⛔
Output the following and **stop**:

> ✅ **Phase 1 complete.**
>
> I've updated:
> - `spec/requirements.md` — EARS functional & non-functional requirements
> - `spec/acceptance.md` — Given/When/Then acceptance criteria
>
> **Do you approve the requirements?**
> Open either file, add inline comments or edit rows, then reply
> **"Approved"** (or give feedback) to continue to the architecture phase.

---

### Step 5 — Populate `spec/ARCHITECTURE.md` (Phase 2a)
*Only after the user explicitly approves Phase 1.*

1. Read `spec/ARCHITECTURE.md` and `spec/requirements.md` (approved version).
2. Fill in every section of the architecture template:
   - **Overview**: one-paragraph system description.
   - **Architecture Diagram**: ASCII or mermaid block.
   - **Components**: one sub-section per component with Responsibility /
     Technology / Interfaces / Data filled in.
   - **Data Flow**: how data enters, transforms, persists, and is returned.
   - **Integration Points**: external APIs/services table.
   - **Architecture Decision Records**: list decisions with rationale.
   - **Constraints** and **Evolution Plan**.
3. Recommend the best-fit tech stack and justify the choice explicitly.
4. Write the updated file back to `spec/ARCHITECTURE.md`.

---

### Step 6 — Populate `spec/plan.md` (Phase 2b)
1. Read `spec/plan.md`.
2. Fill in:
   - **Overview**: high-level technical approach summary.
   - **Components table**: map each architectural component to a row.
   - **Implementation Order**: dependency-ordered list.
   - **Technical Decisions**: key choices and alternatives considered.
   - **Risks**: at least three risk rows with Impact / Probability / Mitigation.
   - **Estimated Effort**: per-phase rough estimates.
3. Write the updated file back to `spec/plan.md`.

---

### Step 7 — Halt for Phase 2 approval ⛔
Output the following and **stop**:

> ✅ **Phase 2 complete.**
>
> I've updated:
> - `spec/ARCHITECTURE.md` — system architecture, tech stack, component design
> - `spec/plan.md` — implementation order, technical decisions, risk register
>
> **Do you approve the architecture and technical plan?**
> Open either file, add inline comments, then reply
> **"Approved"** to proceed to Phase 3 (task breakdown), or give feedback to rework.

---

## Iterative Rework Loop

If the user replies with feedback (in chat **or** inline comments inside any
`spec/` file):
1. Re-read the affected file(s) to capture all changes and comments.
2. Apply every requested change.
3. Re-save the file(s).
4. Repeat the relevant approval halt message.

Never advance to the next phase without explicit **"Approved"** from the user.

---

## Constraints
- **Do NOT create new spec files** — write only into the existing templates.
- **Do NOT start implementation** (`spec-to-code`, code generation, etc.) until
  the user explicitly triggers the next skill.
- Follow naming conventions in `.agents/rules/coding.md`.
- IDs must be globally unique across the document; never reuse an ID.
- All requirements must trace to at least one acceptance criterion.
