---
name: security-audit
description: >
  Use me to perform a security audit on the codebase.
  I check for common vulnerabilities, secret leaks, and
  adherence to security rules. Produces an audit report.
tools: [Read, Glob, Grep, Bash]
---

# Skill: Security Audit

Scan the codebase for security issues and produce an audit report.

## Steps

1. Read `.agents/rules/security.md` for project-specific security rules
2. Scan for common vulnerabilities:
   - Hardcoded secrets, API keys, passwords
   - SQL injection vectors
   - XSS vulnerabilities
   - Insecure deserialization
   - Missing authentication/authorization checks
   - Insecure dependencies (check lock files)
   - Path traversal vulnerabilities
   - SSRF opportunities
3. Verify security controls:
   - Authentication middleware is properly applied
   - Authorization checks exist for protected resources
   - Input validation is present at boundaries
   - Sensitive data is not logged
   - HTTPS is enforced where applicable
4. Generate `reports/audit.md`

## Output Format

```
## Security Audit Report — [date]

### Critical (must fix before deploy)
- [VULN-001] [file:line] Description, impact, remediation

### High (fix soon)
- [VULN-002] [file:line] Description, impact, remediation

### Medium (address in next sprint)
- [VULN-003] [file:line] Description, impact, remediation

### Low (best practice improvement)
- [VULN-004] [file:line] Description, impact, remediation

### Summary
Total issues: X (Critical: N, High: N, Medium: N, Low: N)
```

## Constraints
- Never skip critical findings, even if they seem unlikely to be exploited
- Provide remediation guidance for every finding
- Check `.env.example` exists and `.env` is in `.gitignore`
