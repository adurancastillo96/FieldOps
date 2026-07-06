# Spec-Driven Development Template — Agent Guidelines

## Project
A tool-agnostic template for spec-driven development with AI agents.
Stack: Any language · Any framework · Any DB · Any infra

## Essential Commands
- build:   `pnpm run build` (or project-specific)
- test:    `pnpm test` (or project-specific)
- lint:    `pnpm run lint` (or project-specific)
- dev:     `pnpm run dev` (or project-specific)

## Architecture in One Line
Modular monolith with clear boundaries — see spec/ARCHITECTURE.md for full detail.

## Conventions
- Follow the coding rules in `.agents/rules/coding.md`
- Follow the security rules in `.agents/rules/security.md`
- Follow the git conventions in `.agents/rules/git.md`
- Before installing dependencies: ask for human confirmation.
- If there is ambiguity: stop and ask, do not assume.
- Every spec artifact lives in `spec/` — code implements specs, never the reverse.
- Tests are mandatory for every implementation task.

## Agent Layer
See `.agents/LOADOUT.md` to know which agent/skill to use in each situation.
Skills available in `.agents/skills/` — activated by description.
Orchestrated workflows in `.agents/workflows/`.

### Skill Folder Structure
Every skill lives in its own folder under `.agents/skills/` and follows this layout:

```
my-skill/
├── SKILL.md        # (Required) Frontmatter metadata + step-by-step instructions
├── scripts/        # (Optional) Python or Bash scripts the skill executes
├── references/     # (Optional) Text files, documentation, or templates
└── assets/         # (Optional) Images or logos used by the skill
```

| Entry | Required | Purpose |
|---|---|---|
| `SKILL.md` | ✅ Yes | Frontmatter (`name`, `description`, `tools`) + full instructions |
| `scripts/` | No | Executable helpers invoked from `SKILL.md` steps |
| `references/` | No | Static reference material: docs, templates, cheat-sheets |
| `assets/` | No | Images, diagrams, or logos referenced in instructions |

## Spec-Driven Development Cycle
1. **Design** (Phase 0) — Define the problem and constraints in DESIGN.md
2. **Specification** (Phase 1) — Write requirements in EARS notation
3. **Technical Plan** (Phase 2) — Architecture, API contracts, DB schema
4. **Task Breakdown** (Phase 3) — Atomic tasks in spec/tasks/
5. **Implementation** (Phase 4) — Code from specs using spec-to-code skill
6. **Verification** (Phase 5) — Tests, security audit, code review

Each phase requires a **human checkpoint** before proceeding to the next.

## Memory & Context
- Architectural decisions: `.agents/memory/decisions.md`
- Learnings: `.agents/memory/learnings.md`
- Session state: `.agents/memory/PICKUP.md`

## Rules (Always Active)
- `.agents/rules/coding.md` — Code conventions
- `.agents/rules/security.md` — Mandatory security rules
- `.agents/rules/git.md` — Commits, branches, PRs
- `.agents/rules/style.md` — Formatting, naming, comments
