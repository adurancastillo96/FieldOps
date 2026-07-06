# Stack Rules: Python

Applies when `spec/requirements.md` declares Python as the primary language.
Read this file alongside `.agents/rules/coding.md`.

## Package & Environment Management
- **Runtime manager**: `uv` — always use `uv` to create envs, add deps, and run scripts.
  - `uv sync` to install from lockfile
  - `uv add <pkg>` to add a dependency (never `pip install` directly)
  - `uv run <cmd>` to execute scripts inside the project env
- **Lockfile**: `uv.lock` must always be committed.
- **Python version**: declare in `pyproject.toml` under `[project] requires-python`.
- Never use `venv`, `virtualenv`, or `pip` directly — `uv` manages all of this.

## Task Runner
- **Justfile** (`just`) is the canonical task runner.
- Every project must have a `justfile` in the root with at minimum:
  ```
  dev       # start dev server
  test      # run test suite
  lint      # run ruff check + pyright
  fmt       # run ruff format
  build     # build artifact
  ```
- Document every recipe with a comment above it.

## Linting & Formatting
- **Linter + formatter**: `ruff`
  - `ruff check .` — lint (replaces flake8, isort, pyupgrade, etc.)
  - `ruff format .` — format (replaces black)
  - Config lives in `pyproject.toml` under `[tool.ruff]`.
  - All code must be ruff-clean before any task is marked complete.
- **No other linters** (`flake8`, `pylint`, `black`, `isort`) — ruff replaces them all.

## Type Checking
- **Type checker**: `pyright` (strict mode preferred).
  - Config in `pyproject.toml` under `[tool.pyright]` or `pyrightconfig.json`.
  - All new code must be fully typed — no `Any` without an explicit `# type: ignore` comment explaining why.
  - Run `pyright` in CI alongside ruff.

## Testing
- **Test runner**: `pytest`
  - Tests live in `tests/` mirroring `src/` structure.
  - Config in `pyproject.toml` under `[tool.pytest.ini_options]`.
  - Use `pytest-cov` for coverage reports.
  - Minimum coverage: 80% overall, 90% for critical paths.
- **Test style**:
  - Prefer plain functions over test classes unless grouping is essential.
  - Use `pytest.fixture` for shared setup — no `setUp`/`tearDown`.
  - Name tests: `test_<unit>_<scenario>_<expected>`.
- Run with: `just test` → `uv run pytest`

## Project Layout
```
project-root/
├── justfile
├── pyproject.toml      # single source of truth for all tool config
├── uv.lock
├── src/
│   └── <package>/
│       └── __init__.py
└── tests/
    └── test_<module>.py
```
- Use `src/` layout (`src/<package>/`) — never flat layout.
- Package name in `pyproject.toml` must match the folder under `src/`.

## pyproject.toml Conventions
- All tool configuration lives in `pyproject.toml` — no `setup.py`, `setup.cfg`, `.flake8`, `mypy.ini`.
- Required sections: `[project]`, `[tool.ruff]`, `[tool.pyright]`, `[tool.pytest.ini_options]`.

## Constraints
- Never commit a `.env` file — use `.env.example` as the reference.
- Never use `print()` for logging — use the `logging` stdlib module or `structlog`.
- Always handle exceptions with specific types, never bare `except:`.
