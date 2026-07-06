# Loadout — When to Use What

Quick reference for which agent, skill, or workflow to activate in each situation.

| Situation | Persona | Skill | Workflow |
|---|---|---|---|
| Write / refine technical specification | architect | write-specs | — |
| New feature from scratch | architect | spec-to-code | feature-branch.md |
| Review a PR | reviewer | code-review | — |
| Bug reported in production | — | — | bug-fix.md |
| Implement task from spec | engineer | spec-to-code | — |
| Generate tests | tester | run-tests | — |
| Document existing module | docs-writer | generate-docs | — |
| Investigate library/pattern | researcher | — | — |
| Release to production | devsecops | release-prep | release.md |
| Local environment bring-up / dev server | devsecops | deploy-app | — |
| Deploy to Google Cloud Run | devsecops | deploy-cloud-run | — |
| CI/CD pipeline authoring | devsecops | — | — |
| Secrets audit / env config | devsecops | security-audit | — |
| Containerize the application | devsecops | — | — |
| Full SDD cycle | all | all | startcycle.md |
| Database schema change | architect | db-migrate | — |
| Security review | reviewer + devsecops | security-audit | — |
| Validate OpenAPI spec / API contracts | reviewer / architect | openapi-validate | — |

## Recommended Model by Task

| Task Type | Model Size | Examples |
|---|---|---|
| Planning / architecture | Large (opus, o3, gemini-pro) | System design, ADRs, requirements |
| Implementation | Medium (sonnet, gpt-4o, gemini-flash) | Code writing, test writing |
| Repetitive / lint | Small (haiku, gpt-4o-mini) | Formatting, simple fixes |
| Research | Large | Library evaluation, pattern analysis |
| Code review | Medium | PR reviews, security checks |

## How to Activate

- **Persona**: Reference by name (e.g., "act as the architect agent")
- **Skill**: Reference by name or trigger phrase (e.g., "use spec-to-code for T001")
- **Workflow**: Reference by name (e.g., "run the feature-branch workflow")
- All definitions are in `.agents/personas/`, `.agents/skills/`, and `.agents/workflows/`
