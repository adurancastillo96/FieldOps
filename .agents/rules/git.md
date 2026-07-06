# Git Conventions

Rules for commits, branches, and pull requests.

## Commit Messages
Follow Conventional Commits format:

```
<type>(<scope>): <short description>

[optional body]

[optional footer(s)]
```

### Types
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only
- `style`: Formatting, no code change
- `refactor`: Code change that neither fixes nor adds
- `test`: Adding or updating tests
- `chore`: Build, CI, tooling changes
- `perf`: Performance improvement
- `security`: Security fix

### Rules
- Subject line: max 72 characters, imperative mood
- Body: explain *why*, not *what* (the diff shows what)
- Reference task IDs: `refs T001` or `closes T001`
- One logical change per commit
- Never commit secrets, credentials, or `.env` files

## Branches
- `main` — production-ready code, always deployable
- `develop` — integration branch (if using gitflow)
- `feature/<description>` — new features
- `fix/<description>` — bug fixes
- `release/<version>` — release preparation
- `hotfix/<description>` — urgent production fixes

### AI Agent Branches
- `ai/<agent-name>/<description>` (e.g., `ai/claude/add-user-auth`)
- `ai/<agent-name>/<task-id>` (e.g., `ai/gemini/T042`)

## Pull Requests
- Title: follows commit message format
- Description includes: What, Why, How, Testing
- Link to related task spec: `spec/tasks/TXXX.md`
- All tests must pass before merge
- Require at least one review (human or agent)
- Squash merge to keep history clean

## What NOT to Commit
- `.env` files with real values
- `node_modules/` or other dependency directories
- Build artifacts (`dist/`, `build/`)
- IDE configuration (`.vscode/`, `.idea/`)
- OS files (`.DS_Store`, `Thumbs.db`)
