---
description: Workflow: Prepare, verify, and execute a project release.
---

# Workflow: Release

Prepare, verify, and execute a project release.

## Step 1 — Pre-Release Check
- Verify all release-targeted tasks are ✅ completed
- Check `.agents/memory/PICKUP.md` for any open issues
- Review `.agents/memory/decisions.md` for any pending decisions
- **Ask**: Are there any blockers for this release?

## Step 2 — Test Suite
- Run full test suite using `run-tests` skill
- All tests must pass — zero tolerance for failures
- Coverage must meet thresholds

## Step 3 — Security Audit
- Run `security-audit` skill
- No critical or high issues allowed
- Medium issues: document as known issues if acceptable

## Step 4 — Release Artifacts
- Use `release-prep` skill to generate:
  - CHANGELOG.md updates
  - Version bump
  - Release notes
  - Deployment checklist

## Step 5 — Documentation Review
- Verify `docs/DEPLOYMENT.md` is current
- Verify API documentation matches implementation
- Verify README is up to date

## Step 6 — Human Approval
- Present release summary:
  - Version number
  - Changes included
  - Test results
  - Security audit results
  - Deployment checklist
- **CHECKPOINT**: Human approves or rejects the release

## Step 7 — Post-Release
- Update `.agents/memory/PICKUP.md`
- Update `.agents/memory/decisions.md` if applicable
- Close related tasks and issues
- Monitor for deployment issues