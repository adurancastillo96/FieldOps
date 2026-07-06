---
name: deploy-app
description: >
  Use me to detect the project stack, install dependencies, and start a
  local development server. I inspect spec/requirements.md and src/ to
  choose the right package manager and run command automatically.
  Owned by the devsecops persona. Activate with /deploy-app or by name.
tools: [Read, Bash]
---

# Skill: Deploy App

Bring the application to life locally: detect the stack, install dependencies,
start the dev server, and confirm it is healthy.

## Steps

### Step 1 — Stack detection
1. Read `spec/requirements.md` — note the declared language and framework.
2. Cross-check by inspecting files present in `src/`:

| Signal file | Stack detected | Package manager | Dev command |
|---|---|---|---|
| `package.json` with `"scripts.dev"` | Node / JS / TS | `pnpm install` | `pnpm run dev` |
| `package.json` with `"scripts.start"` | Node (no dev script) | `pnpm install` | `pnpm start` |
| `requirements.txt` | Python (pip) | `pip install -r requirements.txt` | `python app.py` or as specified |
| `pyproject.toml` / `uv.lock` | Python (uv) | `uv sync` | `uv run <entrypoint>` |
| `go.mod` | Go | `go mod download` | `go run ./...` |
| `Cargo.toml` | Rust | `cargo build` | `cargo run` |
| `mix.exs` | Elixir | `mix deps.get` | `mix phx.server` |

If the signal is ambiguous, use `spec/requirements.md` as the source of truth.
If still unclear: **stop and ask** — do not assume.

### Step 2 — Environment validation
3. Check that a `.env` file exists (or `.env.local` for Node projects).
   - If missing, copy `.env.example` → `.env` and warn the user to fill in secrets.
   - List any variables that have empty values and flag them as ⚠️ requires attention.

### Step 3 — Install dependencies
4. Run the appropriate install command from inside `src/`:
   - Use the package manager detected in Step 1.
   - If a new global tool is needed (e.g., `pnpm` is missing): **ask for
     confirmation** before installing anything globally.
5. If the install exits with errors:
   - Show the error output.
   - Diagnose the cause (version mismatch, missing system lib, etc.).
   - Suggest a fix. **Do not silently retry** in a loop.

### Step 4 — Start the dev server
6. Run the dev command in the **background** so the terminal stays free.
7. Wait up to 15 seconds for the server to respond on its port.
8. Perform a basic health check: `curl -s -o /dev/null -w "%{http_code}" http://localhost:<PORT>`.
   - `2xx` or `3xx` → healthy ✅
   - No response / `5xx` → unhealthy ❌ — show last 20 lines of server log.

### Step 5 — Report
9. Output the result:

```
## 🚀 App is live!

- **URL**: http://localhost:<PORT>
- **Stack**: <detected stack>
- **Started with**: <command used>
- **Status**: ✅ Healthy (HTTP <code>)

⚠️ Environment warnings (if any):
- VAR_NAME is empty — set it in .env before using [feature]
```

---

## Constraints
- Run all commands **inside `src/`**, not from the project root.
- **Never install global tools** without explicit user confirmation.
- **Never modify `spec/` files** — this skill is execution-only.
- If the server fails to start after one attempt: report the logs and stop.
  Do not enter a silent retry loop.
- Never expose or print secret values from `.env` — only print variable *names*.
- This skill handles **local dev only**. Production deployment is out of scope
  (use the CI/CD pipeline or a dedicated deploy workflow).
