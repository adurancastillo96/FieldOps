---
description: Diagnose, fix, and verify a reported bug.
---

# Workflow: Bug Fix

Diagnose, fix, and verify a reported bug.

## Step 1 — Understand the Bug
- Read the bug report carefully
- Identify: expected behavior vs. actual behavior
- Identify: reproduction steps
- **Ask**: Is there enough information to reproduce?

## Step 2 — Reproduce
- Write a failing test that demonstrates the bug
- If can't reproduce: ask for more information, don't guess
- Document reproduction steps

## Step 3 — Diagnose
- Trace the code path from input to incorrect output
- Identify the root cause (not just the symptom)
- Check: is this a single bug or a systemic issue?
- Document the root cause

## Step 4 — Fix
- Branch naming: `fix/<short-description>`
- Make the minimal change that fixes the root cause
- Do NOT fix unrelated issues in the same change
- Ensure the failing test now passes

## Step 5 — Regression Test
- The reproduction test from Step 2 serves as regression test
- Add edge case tests around the fix
- Run the full test suite — no new failures

## Step 6 — Verify
- Use the `code-review` skill on the fix
- Verify the fix doesn't introduce new issues
- **CHECKPOINT**: Human reviews and approves the fix

## Step 7 — Document
- Update `.agents/memory/learnings.md` with what caused the bug
- If a rule would prevent this class of bug: add to `.agents/rules/`
- Update task/issue status