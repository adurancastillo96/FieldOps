# Stack Rules: Astro

Applies when `spec/requirements.md` declares Astro as the primary framework.
Read this file alongside `.agents/rules/coding.md` AND `.agents/rules/stacks/node.md`
(Astro is Node-based — all Node rules apply unless overridden here).

## Framework Version & Setup
- **Astro v5+** — always use the latest stable Astro major.
- Bootstrap with: `pnpm create astro@latest ./` in non-interactive mode.
- Use the **strict** TypeScript template.
- Enable `strictNullChecks` and `verbatimModuleSyntax` in `tsconfig.json`.

## Rendering Strategy
- Default to **static output** (`output: 'static'`) unless the spec requires SSR.
- Use **SSR** (`output: 'server'`) only when the spec explicitly requires:
  - Authentication
  - Dynamic data per-request
  - API routes with side effects
- Use **hybrid** (`output: 'hybrid'`) when most pages are static with isolated SSR routes.
- Document the rendering strategy choice as an ADR.

## Component Rules
- **`.astro` files** for pages and layout-level components — no logic-heavy JS.
- **Framework components** (React, Vue, Svelte) only when interactivity is required.
  - Declare the integration in `astro.config.mjs`: `@astrojs/react`, `@astrojs/vue`, etc.
  - Use `client:` directives intentionally — prefer `client:idle` or `client:visible`
    over `client:load` to avoid blocking paint.
  - Never use a framework component for static content.
- Keep `.astro` components lean: data fetching at the top, markup below.

## File & Folder Structure
```
project-root/
├── astro.config.mjs
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── public/             # static assets (fonts, images, favicons)
└── src/
    ├── components/     # reusable UI components (.astro or framework)
    ├── layouts/        # page shell components
    ├── pages/          # file-based routing — one file per route
    │   └── api/        # API endpoints (.ts files)
    ├── content/        # Content Collections (type-safe Markdown/MDX)
    ├── styles/         # global CSS / design tokens
    └── lib/            # shared utilities, data fetchers, helpers
```
- Never put logic in `public/` — it is served as-is.
- Never put page-specific styles in `src/styles/` — scope them inside the `.astro` file.

## Content Collections
- Use **Content Collections** for any Markdown/MDX-based content (blog, docs, etc.).
- Define schemas in `src/content/config.ts` with Zod — every collection must be typed.
- Never access content files directly with `fs` — always use `getCollection()`.

## Styling
- **Scoped styles** by default — use `<style>` inside `.astro` files.
- Global styles only for design tokens, resets, and utility classes — in `src/styles/`.
- Prefer **CSS custom properties** for theming.
- Allowed CSS preprocessors: plain CSS or **Sass** (`@astrojs/sass`).
- No inline `style` attributes for anything beyond dynamic values.

## Performance Defaults (non-negotiable)
- All images must use Astro's `<Image />` component (`astro:assets`) — never raw `<img>`.
- Fonts must be loaded with `font-display: swap` and preloaded via `<link rel="preload">`.
- No unused integrations — every `astro.config.mjs` integration must be justified.
- Core Web Vitals targets: LCP < 2.5s, CLS < 0.1, INP < 200ms.

## Testing
- **Unit tests** (components, lib): `vitest` — inherits from Node stack rules.
- **E2E tests**: `playwright` — config in `playwright.config.ts`.
  - E2E tests live in `e2e/` at project root.
  - Run: `pnpm test:e2e`
- Run all: `pnpm test` (vitest) + `pnpm test:e2e` (playwright).

## Deployment
- **Static output**: deploy via `deploy-cloud-run` skill or direct CDN (Netlify, Vercel, CF Pages).
- **SSR output**: requires an Astro adapter (`@astrojs/node`, `@astrojs/cloudflare`, etc.)
  declared in `astro.config.mjs` — choose based on `spec/ARCHITECTURE.md`.
- Build with: `pnpm build` → outputs to `dist/`.

## Constraints
- Never use `document` or `window` inside `.astro` frontmatter — server context only.
- Never bypass Content Collections for typed content.
- Never use `client:load` on components that do not need immediate interactivity.
- Always run `pnpm astro check` (type-checks `.astro` files) in CI alongside `tsc`.
