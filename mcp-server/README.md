# Portfolio MCP server

A [Model Context Protocol](https://modelcontextprotocol.io) server that lets AI assistants (Claude, Cursor, VS Code Copilot, Windsurf, Gemini) answer questions about Joseph Clyde S. Daño's projects, skills, and experience.

It reads the website's own `../content.js`, so assistants always see exactly what the portfolio shows. Edit `content.js` and the next tool call picks up the change; no restart needed.

## Setup

```bash
cd mcp-server
npm install
```

Optional settings go in `mcp-server/.env` (see `.env.example`):

| Variable | Purpose |
| --- | --- |
| `PORTFOLIO_SITE_URL` | Adds case-study links to project results. |
| `PORTFOLIO_SUPABASE_URL`, `PORTFOLIO_SUPABASE_ANON_KEY` | Adds certificates managed in `admin.html`. |
| `PORTFOLIO_CONTENT_FILE` | Reads a different content file. |

## Tools

| Tool | What it returns |
| --- | --- |
| `get_portfolio_overview` | Name, role, bio, contact links, and summary stats. |
| `list_projects` | Projects, filterable by category, technology, or featured status. |
| `get_project_details` | Full case study for one project (by id or title keyword). |
| `search_skills` | Tech stack groups, filterable by group or keyword. |
| `get_resume` | Experience and education entries. |
| `query_portfolio` | Free-text search across everything. |

Resources: `portfolio://overview`, `portfolio://projects`, `portfolio://skills`, `portfolio://resume`, `portfolio://items`.

## Connect an AI client

**VS Code and Cursor** are already configured for this repository in `.vscode/mcp.json` and `.cursor/mcp.json`. Open the project folder and enable the `jc-portfolio` server.

**Claude Desktop** — add to `claude_desktop_config.json` (`%APPDATA%\Claude\` on Windows), using the absolute path to this folder:

```json
{
  "mcpServers": {
    "jc-portfolio": {
      "command": "node",
      "args": ["C:/path/to/MyPortfolio/mcp-server/index.js"]
    }
  }
}
```

**Claude Code** — from the repository root:

```bash
claude mcp add jc-portfolio -- node mcp-server/index.js
```

## Tests

```bash
node test-mcp.js         # data loading
node test-mcp-tools.js   # tools over an in-memory transport
node test-server.js      # stdio handshake
```
