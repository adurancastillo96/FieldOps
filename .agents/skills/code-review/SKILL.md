---
name: code-review
description: >
  Use me to perform a structured code review on changed files.
  I check correctness, security, performance, convention adherence,
  and spec alignment. Can auto-fix issues after human confirmation.
  Produces a detailed review report. Run with --fix to apply fixes.
tools: [Read, Write, Glob, Grep, Bash]
---

# Skill: Code Review

Perform a thorough code review and, optionally, apply fixes directly to `src/`.

## Modes

| Mode | Behaviour |
|---|---|
| *(default)* | Review only — produces a report, touches no files |
| `--fix` | Review first, then ask for confirmation before overwriting any file |

---

## Steps

### Phase 1 — Review (always runs)

1. Identify the files to review (from diff, PR, specified paths, or all of `src/`).
2. Read the related task spec in `spec/tasks/TXXX.md` for scope context.
3. Read `spec/requirements.md` — verify the code uses the approved tech stack
   and language; flag any deviation as a **Critical** issue.
4. Check each file against:
   - `.agents/rules/coding.md` (conventions, naming, structure)
   - `.agents/rules/security.md` (auth, input validation, secrets)
   - `.agents/rules/style.md` (formatting, comments)
5. Hunt for functional issues:
   - Dependency mismatches (wrong versions, missing packages in manifest)
   - Unhandled errors and missing edge-case guards
   - Logic breaks and incorrect control flow
   - Resource leaks (open handles, unclosed connections)
6. Verify test coverage for all changed code.
7. Produce the structured review report (see Output Format below).

### Phase 2 — Fix (only when `--fix` is requested)

8. After delivering the report, output:
   > 🔧 **Fix mode active.** I found N issue(s) I can correct automatically.
   > Shall I overwrite the affected files in `src/`? Reply **"Apply fixes"** to proceed.

9. Wait for explicit confirmation. If confirmed:
   - Fix every **Critical** and **High** issue identified in Phase 1.
   - Overwrite only the files that contain fixes — do not touch unrelated files.
   - Re-run lint and tests after applying fixes.
   - Report which files were changed and what was corrected.

---

## Output Format

```
## Code Review: [files / PR / task]

### Summary
[One-paragraph overview of what was reviewed and overall quality]

### Spec Alignment
- Stack declared in spec/requirements.md: [language/framework]
- Stack found in src/: [language/framework]
- Verdict: ✅ Aligned / ❌ Mismatch — [details]

### Critical Issues (blocks merge / must fix)
- [file:line] Description · Impact · Suggested fix

### High Issues (fix soon)
- [file:line] Description · Impact · Suggested fix

### Warnings (needs discussion)
- [file:line] Description of concern

### Suggestions (optional improvements)
- [file:line] Description of suggestion

### Verdict: ✅ Approved / ❌ Changes Requested
```

---

## Constraints
- **Default mode is read-only** — never modify files unless `--fix` was requested
  and the user has explicitly confirmed.
- Be specific: always reference file paths and line numbers.
- Be constructive: every issue must include a suggested fix.
- Security issues are always **Critical** — no exceptions.
- Spec alignment failures (wrong language/framework) are always **Critical**.
- If fixing, only overwrite files within `src/` — never touch spec files.
