---
name: release-prep
description: >
  Use me to prepare a release: changelog, version bump, tag,
  and deployment checklist. I verify everything is ready before release.
tools: [Read, Write, Bash, Glob, Grep]
---

# Skill: Release Preparation

Prepare a project release with all necessary artifacts.

## Steps

1. Verify all tasks for this release are ✅ completed
2. Run the full test suite — all tests must pass
3. Run security audit — no critical issues allowed
4. Generate/update CHANGELOG.md:
   - Group changes by: Added, Changed, Deprecated, Removed, Fixed, Security
   - Reference task IDs and PR numbers
5. Bump version number (following semver)
6. Generate release notes (human-readable summary)
7. Create deployment checklist:
   - [ ] All tests pass
   - [ ] Security audit clean
   - [ ] Database migrations ready
   - [ ] Environment variables documented
   - [ ] Rollback plan documented
   - [ ] Monitoring/alerts configured
8. Present summary for human approval

## Versioning
- MAJOR: breaking changes to public API
- MINOR: new features, backward compatible
- PATCH: bug fixes, backward compatible

## Constraints
- Never release with failing tests
- Never release with critical security issues
- Always require human approval before tagging
- Ensure DEPLOYMENT.md is up to date
