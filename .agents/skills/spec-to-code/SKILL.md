---
name: spec-to-code
description: >
  Use me when you have a task defined in spec/tasks/TXXX.md and want to
  implement it. Converts specification into code following workspace rules.
  Writes in the exact language/framework defined in spec/requirements.md.
  Includes unit tests. Activate by name or with /spec-to-code.
tools: [Read, Write, Bash]
---

# Skill: Spec to Code

Convert a spec task into complete, working code with tests — in the exact
language and framework the architect approved.

## Steps

1. **Read the spec context**
   - Read `spec/requirements.md` — identify the approved tech stack and language.
   - Read the designated task in `spec/tasks/TXXX.md` — this is your scope.
   - Read `spec/ARCHITECTURE.md` and `spec/API_SPEC.md` if applicable.
   - Read `.agents/rules/coding.md` and `.agents/rules/security.md`.

2. **Scaffold or extend the output structure**
   - All code lives under `src/`, following the folder structure defined in
     `spec/ARCHITECTURE.md`. Never invent a different layout.
   - If this is the first task, generate the full scaffold:
     backend, frontend, config files — whatever the spec calls for.
   - Ensure dependency manifests are always present and accurate:
     `package.json`, `requirements.txt`, `go.mod`, `Cargo.toml`, etc. — whichever
     the stack requires.

3. **Write the implementation**
   - Use the exact language and framework defined in `spec/requirements.md`.
   - Implement **all** code required by the task's Definition of Done.
   - **Do not skip, stub, or summarize any code block.** Every file must be
     complete and runnable — no `// TODO: implement this` placeholders.
   - Follow every rule in `.agents/rules/coding.md` (naming, error handling,
     logging patterns, etc.).
   - Follow every rule in `.agents/rules/security.md` (input validation,
     secret handling, auth checks, etc.).

4. **Write unit tests**
   - Cover all public functions/methods added or changed by this task.
   - Follow the coverage thresholds from the `run-tests` skill.
   - Tests live alongside their subject following the project convention.

5. **Verify**
   - Run the test suite. If any test fails, iterate until all pass.
   - Run lint. All code must be lint-clean before proceeding.

6. **Update the task**
   - Mark the task as ✅ completed in `spec/tasks/TXXX.md`.
   - Add a note with: files created/modified, tests added, and any relevant
     implementation decisions made.

7. **Report summary**
   ```
   ## ✅ Task TXXX complete

   ### Files created / modified
   - src/...

   ### Tests added
   - N tests, coverage: X%

   ### Notes
   - [Any deviations, decisions, or follow-up items]
   ```

## Constraints
- **Do NOT modify files outside the scope of the task.**
- **Do NOT skip or summarize code** — every file must be production-complete.
- If you find ambiguity in the spec: **stop and report**, do not assume.
- If you need a new dependency: **ask for confirmation** before installing.
- Follow the error response format defined in `spec/API_SPEC.md`.
- All code must pass lint before marking the task complete.
- The output language/framework is dictated by `spec/requirements.md` —
  never default to a different stack without explicit instruction.
