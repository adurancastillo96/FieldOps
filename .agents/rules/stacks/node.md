# Stack Rules: Node.js / TypeScript

Applies when `spec/requirements.md` declares Node.js or TypeScript as the primary language.
Read this file alongside `.agents/rules/coding.md`.

## Package & Environment Management
- **Package manager**: `pnpm` — always and only `pnpm`. Never `npm` or `yarn`.
  - `pnpm install` to install from lockfile
  - `pnpm add <pkg>` / `pnpm add -D <pkg>` for dev deps
  - `pnpm run <script>` to execute scripts
- **Lockfile**: `pnpm-lock.yaml` must always be committed.
- **Node version**: declared in `package.json` under `engines.node` and in `.nvmrc`.
- Use `pnpm workspaces` for monorepos — never `npm workspaces` or `lerna`.

## Task Runner
- Use `package.json` `scripts` as the canonical task runner.
- Every project must define at minimum:
  ```json
  {
    "scripts": {
      "dev":    "...",
      "build":  "...",
      "test":   "...",
      "lint":   "...",
      "typecheck": "tsc --noEmit"
    }
  }
  ```
- For complex task orchestration, a `justfile` is acceptable alongside `package.json`.

## Language
- **TypeScript** is mandatory — no plain JavaScript in source files.
- `tsconfig.json` must enable `strict: true` with no exceptions.
- Never use `any` — use `unknown` and narrow with type guards.
- No `@ts-ignore` without an accompanying comment explaining why.
- Keep `tsconfig.json` and `tsconfig.build.json` (excludes tests) separate.

## Linting & Formatting
- **Linter**: `eslint` with `typescript-eslint`.
  - Config in `eslint.config.ts` (flat config — ESLint v9+).
  - `pnpm lint` must exit clean before any task is marked complete.
- **Formatter**: `prettier`
  - Config in `.prettierrc` or `prettier.config.ts`.
  - Prettier runs via `eslint-plugin-prettier` — single pass for lint + format.
- No `tslint` — it is deprecated.

## Testing
- **Test runner**: `vitest` (preferred) or `jest` if the framework mandates it.
  - Config in `vitest.config.ts`.
  - Tests live in `src/` co-located with source: `<module>.test.ts`.
  - Use `@vitest/coverage-v8` for coverage.
  - Minimum coverage: 80% overall, 90% for critical paths.
- **Test style**:
  - Use `describe` / `it` blocks — verb-first (`it('returns user by id')`).
  - Mock at the module boundary, not deep inside implementation.
  - Prefer `vi.fn()` over hand-rolled mocks.
- Run with: `pnpm test`

## Project Layout
```
project-root/
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── tsconfig.build.json
├── eslint.config.ts
├── src/
│   ├── index.ts
│   └── <module>/
│       ├── index.ts
│       └── index.test.ts
└── dist/          # gitignored build output
```

## Constraints
- Never import from `dist/` in source code.
- Never commit `node_modules/` or `dist/`.
- Never use `require()` — always `import` (ESM).
- Never use `var` — always `const` or `let`.
- Always use `strict` equality (`===`, never `==`).
- Never commit a `.env` file — use `.env.example` as the reference.
- Use `console.error` only for critical errors; prefer a structured logger (e.g., `pino`).
