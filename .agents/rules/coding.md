# Coding Conventions

These rules are always active in the workspace. Every agent must follow them.

## Stack Rules (auto-load)
Before starting any task, read `spec/requirements.md` to identify the declared
language/framework, then load the corresponding stack file:

| Stack declared in spec | Load this file |
|---|---|
| Python | `.agents/rules/stacks/python.md` |
| Node.js / TypeScript | `.agents/rules/stacks/node.md` |
| Astro | `.agents/rules/stacks/node.md` **+** `.agents/rules/stacks/astro.md` |

Stack rules override general rules in this file when they conflict.
If the stack has no file yet: follow general rules and note the gap.


## General
- Write clear, self-documenting code. Comments explain *why*, not *what*.
- Functions should do one thing and do it well.
- Keep functions short: aim for < 30 lines.
- Maximum file length: 300 lines. If longer, consider splitting.
- Avoid magic numbers and strings — use named constants.
- Handle errors explicitly — never swallow exceptions silently.

## Naming
- Variables: `camelCase` (or language convention)
- Functions: `camelCase` — verb-first (e.g., `getUserById`)
- Classes: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Files: `kebab-case` (or language convention)
- Booleans: prefix with `is`, `has`, `should`, `can`

## Structure
- One module/class per file
- Group imports: stdlib, external, internal
- Order within file: types, constants, functions, exports
- Prefer composition over inheritance
- Prefer pure functions where possible

## Dependencies
- Never install a dependency without human approval
- Justify every new dependency: what problem does it solve?
- Prefer stdlib solutions when available
- Pin dependency versions in lock files
- Regularly audit for unused dependencies

## Error Handling
- Use typed/specific errors, not generic ones
- Include context in error messages
- Log errors with structured metadata
- Don't use exceptions for control flow
- Always handle promise rejections / async errors

## Performance
- Don't optimize prematurely, but don't be wasteful
- Use pagination for list endpoints
- Index database columns used in WHERE clauses
- Cache expensive computations when appropriate
- Profile before optimizing
