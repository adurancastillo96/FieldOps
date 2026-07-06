# Contributing Guide

## Getting Started

1. Clone the repository
2. Install dependencies: `pnpm install` (or project-specific)
3. Copy `.env.example` to `.env` and fill in values
4. Run the development server: `pnpm dev`

## Development Workflow

1. Pick a task from `spec/tasks/` (status: Pending)
2. Create a feature branch: `git checkout -b feature/<description>`
3. Implement following the task's spec and DoD
4. Write tests for your changes
5. Run the full test suite: `pnpm test`
6. Run the linter: `pnpm lint`
7. Verify the production build: `pnpm build`
8. Open a Pull Request

## Code Standards

Follow the rules in:
- `.agents/rules/coding.md` — Code conventions
- `.agents/rules/security.md` — Security rules
- `.agents/rules/git.md` — Git conventions
- `.agents/rules/style.md` — Style guide

## Pull Request Process

1. Fill in the PR template completely
2. Link to the related task spec (`spec/tasks/TXXX.md`)
3. Ensure all tests pass
4. Request review
5. Address feedback
6. Squash and merge when approved

## Spec-Driven Development

This project follows SDD principles:
- **Specs come first**: Code implements specifications, never the reverse.
- **Human checkpoints**: Major decisions require human approval.
- **Atomic tasks**: Each task in `spec/tasks/` is independently implementable.
- See `.agents/workflows/sdd-full-cycle.md` for the full process.

## Getting Help

- Check `docs/` for documentation
- Review `spec/` for specifications
- Read `.agents/memory/decisions.md` for past decisions
- Read `.agents/memory/learnings.md` for known pitfalls
