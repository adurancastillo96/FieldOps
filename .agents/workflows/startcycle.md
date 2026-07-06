---
description: Start the spec-driven development pipeline sequence with a new idea.
slash_command: /startcycle
---

# Workflow: Start SDD Cycle

Trigger: `/startcycle <idea>` — orchestrate the full spec-driven development
cycle from raw idea to verified, deployed application.

---

## Before you begin
- Read `.agents/memory/PICKUP.md` — resume from any previous session state.
- Read `.agents/memory/decisions.md` — honour all prior architectural decisions.
- Rules always active: `.agents/rules/coding.md` · `.agents/rules/security.md`
  · `.agents/rules/git.md` · `.agents/rules/style.md`

---

## Phase 0 — Design
| | |
|---|---|
| **Persona** | `@architect` |
| **Skill** | — (structured conversation) |
| **Input** | Raw user idea from `/startcycle <idea>` |
| **Output** | `DESIGN.md` — problem statement, users, constraints, success criteria |

**Steps:**
1. Restate the idea in one sentence; surface all ambiguities.
2. Ask the minimum necessary questions to resolve unknowns.
3. Write `DESIGN.md` to the project root.

> ⛔ **CHECKPOINT 0** — Human reviews `DESIGN.md`.
> Reply **"Approved"** or provide feedback before Phase 1 starts.

---

## Phase 1 — Specification
| | |
|---|---|
| **Persona** | `@architect` |
| **Skill** | `write-specs` (Phase 1 steps) |
| **Input** | Approved `DESIGN.md` |
| **Output** | `spec/requirements.md` (EARS) · `spec/acceptance.md` (Given/When/Then) |

**Steps:**
1. Activate `write-specs` — follow its Phase 1 steps exactly.
2. Populate `spec/requirements.md` with EARS requirements (FR + NFR).
3. Populate `spec/acceptance.md` with Given/When/Then criteria linked to each FR.

> ⛔ **CHECKPOINT 1** — Human reviews requirements and acceptance criteria.
> Reply **"Approved"** or annotate the files inline before Phase 2 starts.

---

## Phase 2 — Technical Plan
| | |
|---|---|
| **Persona** | `@architect` |
| **Skill** | `write-specs` (Phase 2 steps) · `openapi-validate` · `db-migrate` |
| **Input** | Approved `spec/requirements.md` |
| **Output** | `spec/ARCHITECTURE.md` · `spec/plan.md` · `spec/API_SPEC.md` *(if applicable)* · `spec/DB_SCHEMA.md` *(if applicable)* · `docs/ADR/` |

**Steps:**
1. Activate `write-specs` — follow its Phase 2 steps exactly.
2. If the spec defines an API: validate with `openapi-validate`.
3. If the spec defines a database: design schema with `db-migrate`.
4. Record all key decisions as ADRs in `docs/ADR/`.

> ⛔ **CHECKPOINT 2** — Human validates architecture and technical plan.
> Reply **"Approved"** or annotate files inline before Phase 3 starts.

---

## Phase 3 — Task Breakdown
| | |
|---|---|
| **Persona** | `@architect` |
| **Skill** | — |
| **Input** | Approved `spec/plan.md` |
| **Output** | `spec/tasks/TXXX.md` — one file per atomic task |

**Steps:**
1. Decompose the plan into atomic tasks (each completable in one session).
2. Each task file must include: Goal, Inputs, Outputs, Definition of Done, Dependencies.
3. Order tasks by dependency graph; number sequentially (`T001`, `T002`, …).

> ⛔ **CHECKPOINT 3** — Human reviews task list and re-prioritizes if needed.
> Reply **"Approved"** before Phase 4 starts.

---

## Phase 4 — Implementation
| | |
|---|---|
| **Persona** | `@engineer` |
| **Skill** | `spec-to-code` |
| **Input** | `spec/tasks/TXXX.md` |
| **Output** | Complete code + tests in `src/` · dependency manifests |

**Steps:**
1. Activate `spec-to-code` for each task.
2. Use the exact language/framework declared in `spec/requirements.md`.
3. Write **complete** code — no stubs, no TODOs, no placeholders.
4. Ensure all dependency manifests (`package.json`, `requirements.txt`, etc.) are present.
5. Tasks with no dependencies can be **parallelized**.
6. Mark each task ✅ in its `spec/tasks/TXXX.md` when done.

> ⛔ **CHECKPOINT 4** — Human reviews generated PRs / diffs.
> Reply **"Approved"** before Phase 5 starts.

---

## Phase 5 — Verification
| | |
|---|---|
| **Persona** | `@tester` + `@reviewer` |
| **Skills** | `run-tests` · `code-review` · `code-review --fix` · `security-audit` · `generate-docs` |
| **Input** | Implemented code in `src/` |
| **Output** | `reports/coverage.md` · `reports/audit.md` · `docs/` updated |

**Steps (in order):**
1. `run-tests` — full test suite; all must pass, coverage thresholds met.
2. `code-review` — check spec alignment, correctness, conventions, security.
   - If issues found: use `code-review --fix` after human confirmation.
3. `security-audit` — no Critical or High issues allowed before proceeding.
4. `generate-docs` — update `docs/` to reflect the final implementation.

> ⛔ **CHECKPOINT 5** — Human approves verification results or opens new
> correction tasks (return to Phase 4 for each correction).

---

## Phase 6 — Deploy
| | |
|---|---|
| **Persona** | `@devsecops` |
| **Skills** | `deploy-app` · `deploy-cloud-run` · `release-prep` |
| **Input** | Verified code in `src/` |
| **Output** | Running local server URL · Live Cloud Run URL · Release artifacts |

**Steps:**
1. `deploy-app` — detect stack, install deps, start local dev server, confirm health.
2. Human confirms the app looks correct locally.
3. `release-prep` — changelog, version bump, deployment checklist.
4. `deploy-cloud-run` — containerize and push to Google Cloud Run.
5. Report the live production URL.

> ⛔ **CHECKPOINT 6** — Human confirms production deploy is healthy.

---

## After the cycle
- Update `.agents/memory/PICKUP.md` with session state and next actions.
- Update `.agents/memory/decisions.md` with any new architectural decisions.
- Update `.agents/memory/learnings.md` with lessons learned.

---

## Orchestration Rules

| Rule | Detail |
|---|---|
| **Phases 0–3** | Strictly sequential — each requires an explicit checkpoint |
| **Phase 4** | Independent tasks can be parallelized |
| **Phase 5** | All verification steps must pass before Phase 6 |
| **Ambiguity** | If a phase produces ambiguity → return to the previous phase, never advance |
| **Model size** | Phases 0–2: large · Phases 3–5: medium · Repetitive/lint: small |
| **Failure** | If any skill fails loudly → stop, report, wait for human input |
| **Scope creep** | Never implement outside the current task's scope — open a new task instead |