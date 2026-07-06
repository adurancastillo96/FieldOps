# Security Rules

These rules are **mandatory** and **non-negotiable**. Security issues are always CRITICAL.

## Secrets
- NEVER hardcode secrets, API keys, passwords, or tokens in source code
- Use environment variables for all sensitive configuration
- Ensure `.env` is in `.gitignore`
- Provide `.env.example` with placeholder values (never real ones)
- Rotate secrets regularly

## Authentication & Authorization
- Always verify authentication before processing requests
- Apply the principle of least privilege
- Validate JWT tokens on every protected route
- Use secure token storage (httpOnly cookies, not localStorage)
- Implement rate limiting on auth endpoints
- Lock accounts after N failed login attempts

## Input Validation
- Validate ALL user input at the boundary (API endpoints, forms)
- Use allowlists, not denylists
- Sanitize output to prevent XSS
- Use parameterized queries to prevent SQL injection
- Validate file uploads: type, size, content
- Limit request body size

## Data Protection
- Hash passwords with bcrypt (cost factor ≥ 12) or argon2
- Encrypt sensitive data at rest
- Use HTTPS for all external communication
- Don't log sensitive data (passwords, tokens, PII)
- Implement proper CORS configuration
- Set security headers: CSP, HSTS, X-Frame-Options

## Dependencies
- Regularly scan for known vulnerabilities
- Keep dependencies up to date
- Review new dependencies for security before installation
- Use lock files to prevent supply chain attacks

## AI Agent Security
- Never include API keys, secrets, or PII in agent prompts or context
- Sanitize and validate all LLM-generated code before execution
- Verify package existence and legitimacy before adding (hallucination check)
- Never execute shell commands from LLM output without human review
- Rate-limit agent actions to prevent runaway operations
- Log all agent-initiated file changes for auditability
- Never allow agents to modify security rules or .gitignore without human approval
- Treat all agent-generated SQL/queries as untrusted input
- Use unique agent identities linked to human sponsors for audit trails

## Incident Response
- If a security issue is found: flag immediately, don't deploy
- Document the vulnerability and remediation
- Update `.agents/rules/security.md` if a new class of issue is found
