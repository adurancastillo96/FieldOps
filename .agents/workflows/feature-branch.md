---
description: Workflow: End-to-end workflow for implementing a new feature.
---

# Workflow: Feature Branch

End-to-end workflow for implementing a new feature.

## Step 1 — Understand the Feature
- Read the feature request/ticket
- Read existing `spec/requirements.md` for context
- Read `spec/ARCHITECTURE.md` to understand where it fits
- **Ask**: Is the feature well-defined enough to proceed?

## Step 2 — Create Branch
- Branch naming: `feature/<short-description>`
- Example: `feature/user-profile-api`

## Step 3 — Write Task Spec
- Create `spec/tasks/TXXX-<feature-name>.md` with:
  - Description
  - Acceptance criteria (DoD)
  - Scope (files to create/modify)
  - Dependencies
  - Constraints
- **CHECKPOINT**: Human reviews the task spec

## Step 4 — Implement
- Use the `spec-to-code` skill
- Follow `.agents/rules/coding.md`
- Write tests alongside implementation

## Step 5 — Self-Review
- Use the `code-review` skill on your own changes
- Fix any critical or warning issues

## Step 6 — Test
- Use the `run-tests` skill
- Ensure coverage meets thresholds
- No regressions in existing tests

## Step 7 — PR Preparation
- Write clear PR description:
  - What: summary of changes
  - Why: link to task spec
  - How: key implementation decisions
  - Testing: what was tested and how
- **CHECKPOINT**: Human reviews and merges PR

## Step 8 — Cleanup
- Update task status to ✅ completed
- Update `.agents/memory/PICKUP.md`