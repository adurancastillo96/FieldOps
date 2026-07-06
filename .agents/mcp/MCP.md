# MCP Integration Guide

Model Context Protocol (MCP) enables AI agents to connect to external tools and services.

## What is MCP?
MCP provides a standardized way for AI agents to access:
- External APIs and services
- Database connections
- File system operations
- Custom tools and integrations

## Configuration
MCP servers are configured per-tool:

### Claude Code
```json
// .claude/mcp_servers.json
{
  "servers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@package/mcp-server"]
    }
  }
}
```

### Cursor
```json
// .cursor/mcp.json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@package/mcp-server"]
    }
  }
}
```

## Adding a New MCP Server
1. Add the server configuration to your tool's config file
2. Document it in `servers.md`
3. Test the connection before relying on it
4. Add any required environment variables to `.env.example`
