# Spec-Driven Development Template

> A tool-agnostic template for spec-driven development with AI agents.
> Works with Claude Code, Cursor, Codex CLI, Gemini CLI, Copilot, Windsurf, and any tool supporting AGENTS.md.

## Quick Start

1. Clone this template
2. Update `AGENTS.md` with your project details
3. Update `DESIGN.md` with your problem and vision
4. Run the SDD full cycle: follow `.agents/workflows/sdd-full-cycle.md`

## Structure

```
my-project/
├── AGENTS.md                 ← Universal source of truth (always in context)
├── DESIGN.md                 ← Vision, problem, design/UX constraints
├── .agents/                  ← AI agent layer — fully agnostic
│   ├── LOADOUT.md            ← Map: which agent/skill for each situation
│   ├── personas/             ← Specialist agent definitions
│   ├── skills/               ← On-demand tasks (triggered by description)
│   ├── workflows/            ← Deterministic multi-agent orchestration
│   ├── rules/                ← Workspace rules (always active)
│   ├── memory/               ← Persistent context between sessions
│   └── mcp/                  ← MCP server integration
├── spec/                     ← SDD artifacts (product source of truth)
│   ├── requirements.md       ← Requirements in EARS notation
│   ├── acceptance.md         ← Acceptance criteria per feature
│   ├── plan.md               ← Technical plan (Phase 2)
│   ├── ARCHITECTURE.md       ← System design, ADR decisions
│   ├── API_SPEC.md           ← Endpoints, contracts, responses
│   ├── DB_SCHEMA.md          ← Tables, relations, indexes
│   └── tasks/                ← One file per atomic task
├── docs/                     ← Project documentation
│   ├── DEPLOYMENT.md
│   ├── CONTRIBUTING.md
│   └── ADR/                  ← Architecture Decision Records
├── reports/                  ← Verifier agent outputs
├── src/                      ← Source code
└── tests/                    ← Test files
```

## Principles

1. **AGENTS.md is the single source of truth** — Tool-specific files are symlinks.
2. **Progressive disclosure** — AGENTS.md is concise; details load on demand.
3. **Mandatory human checkpoints** — The agent never advances phases without approval.
4. **Right model for each task** — Architecture → large. Implementation → medium. Lint → small.
5. **Rules respond to observed failures** — No speculative rules.
6. **Agnostic by design** — Nothing in `.agents/` mentions specific tools.

## Tool Integration

Use the automated setup script:

```bash
./setup-symlinks.sh claude    # Claude Code (CLAUDE.md + .claude/)
./setup-symlinks.sh cursor    # Cursor (.cursor/rules/*.mdc)
./setup-symlinks.sh codex     # Codex CLI (CODEX.md)
./setup-symlinks.sh gemini    # Gemini CLI (GEMINI.md)
./setup-symlinks.sh windsurf  # Windsurf (.windsurfrules + .windsurf/rules/)
./setup-symlinks.sh copilot   # GitHub Copilot (.github/)
./setup-symlinks.sh all       # All tools
./setup-symlinks.sh clean     # Remove all symlinks
```

For manual setup or unsupported tools:

```bash
ln -sf AGENTS.md <TOOL_CONFIG_FILE>
```

## License
MIT
