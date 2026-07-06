---
name: openapi-validate
description: >
  Use me to validate the OpenAPI specification, check for consistency
  between spec/openapi.yaml and spec/API_SPEC.md, lint the schema,
  and optionally generate client/server stubs. Activate when API
  contracts change or before releasing.
tools: [Read, Write, Bash, Glob, Grep]
---

# Skill: OpenAPI Validate & Sync

Validate and maintain consistency of the OpenAPI specification.

## Steps

1. Read `spec/openapi.yaml` and verify it is valid OpenAPI 3.1
2. Cross-check against `spec/API_SPEC.md`:
   - All endpoints in API_SPEC.md must exist in openapi.yaml
   - Error response format must match the ErrorResponse schema
   - Authentication scheme must be consistent
3. Validate schema quality:
   - All paths have operationId
   - All paths have at least one success response
   - All error responses use $ref to components/responses
   - No unused schemas in components
   - All required fields are marked
4. Check for breaking changes (if previous version exists):
   - Removed endpoints
   - Changed required fields
   - Modified response schemas
5. Generate a validation report
6. If issues found: list them with severity and suggested fixes
7. If clean: confirm spec is valid

## Output Format

```
## OpenAPI Validation Report

### Summary
- Spec version: [version from info.version]
- Endpoints: [count]
- Schemas: [count]
- Status: ✅ Valid / ❌ Issues Found

### Issues (if any)
| Severity | Location | Issue | Suggested Fix |
|----------|----------|-------|---------------|
| CRITICAL | paths./x | ... | ... |

### Breaking Changes (if any)
| Change | Impact | Migration |
|--------|--------|-----------|

### Verdict: ✅ Spec Valid / ❌ Needs Fixes
```

## Optional: Code Generation

When requested, generate:
- **Client SDK**: TypeScript types from schemas
- **Server stubs**: Route handlers matching paths
- **Test fixtures**: Example request/response pairs from examples

## Constraints
- Never modify openapi.yaml without human approval for breaking changes
- Keep API_SPEC.md and openapi.yaml in sync — they are complementary views
- API_SPEC.md is the human-readable reference; openapi.yaml is the machine-readable source
- Follow semver for info.version changes
