# MCP Servers — Available Integrations

List of MCP servers configured for this project.

| Server | Purpose | Status |
|---|---|---|
| <!-- server-name --> | <!-- what it does --> | <!-- active/inactive --> |

## How to Add a Server
1. Choose or build an MCP server for your integration
2. Add configuration following the guide in `MCP.md`
3. Add an entry to this table
4. Test the connection
5. Document any required environment variables

## Notes
- MCP configuration is tool-specific (Claude, Cursor, etc.)
- The `.agents/mcp/` directory contains tool-agnostic documentation
- Actual server configs live in tool-specific directories (`.claude/`, `.cursor/`, etc.)
