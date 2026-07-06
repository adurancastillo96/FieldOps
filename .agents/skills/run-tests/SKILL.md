---
name: run-tests
description: >
  Use me to run the project's test suite, analyze results,
  and generate a coverage report. I diagnose failures and suggest fixes.
tools: [Read, Bash, Write]
---

# Skill: Run Tests

Execute tests and produce an actionable report.

## Steps

1. Run the full test suite using the project's test command
2. Collect results: passed, failed, skipped, coverage percentage
3. For any failures:
   - Identify the root cause
   - Check if it's a test bug or a code bug
   - Suggest a specific fix
4. Generate `reports/coverage.md` with:
   - Overall coverage percentage
   - Per-file/module coverage breakdown
   - Uncovered critical paths
5. Report summary to the user

## Coverage Thresholds
- Minimum overall: 80%
- Critical paths (auth, payments, data): 90%
- Utility/helper code: 70%

## Constraints
- Never modify tests just to make them pass without understanding the failure
- If tests reveal a genuine bug: report it, don't silently fix it
- If tests are flaky: flag them and suggest stabilization approach
