# Joseph Clyde's Portfolio - Model Context Protocol (MCP) Server

This directory contains a standalone **Model Context Protocol (MCP) Server** for Joseph Clyde's portfolio. It allows AI models (Gemini, Claude, Cursor, Windsurf, ChatGPT desktop, etc.) to query projects, skills, education, and technical experience using standard MCP **Tools** and **Resources**.

---

## 🌟 Features

- **Standard MCP SDK**: Built on `@modelcontextprotocol/sdk` (Stdio transport).
- **Hybrid Data Source**:
  - **Live Supabase Sync**: Connects to the Supabase `portfolio_items` table if `PORTFOLIO_SUPABASE_URL` and `PORTFOLIO_SUPABASE_ANON_KEY` are provided.
  - **Zero-Config Fallback**: Automatically falls back to offline portfolio data if database credentials are not present.
- **5 MCP Resources**:
  - `portfolio://overview`: Bio, developer role, and summary stats.
  - `portfolio://projects`: Comprehensive list of portfolio projects.
  - `portfolio://skills`: Technical skill breakdown (Web, AI, Data, IoT).
  - `portfolio://resume`: Education and experience timeline.
  - `portfolio://items`: Raw JSON dataset of all items.
- **6 MCP Tools**:
  - `get_portfolio_overview`: Summary overview of developer background.
  - `list_projects`: Filter projects by category, tag, or featured status.
  - `get_project_details`: Detailed info for a specific project (challenge, solution, outcome).
  - `search_skills`: Search skills by domain or keyword.
  - `get_resume`: Retrieve experience and education entries.
  - `query_portfolio`: Free-text search across all portfolio fields.

---

## 🚀 Setup & Installation

### 1. Install Dependencies

Open a terminal in the `mcp-server` directory and run:

```bash
npm install
```

---

## ⚙️ How to Connect to AI Clients

### 1. Antigravity / Gemini IDE

Add the following entry to your `mcp_config.json` or MCP settings in Antigravity / Gemini IDE:

```json
{
  "mcpServers": {
    "jc-portfolio": {
      "command": "node",
      "args": [
        "C:/Users/Joseph Clyde/OneDrive/Desktop/Cloy's/Cloy's Project/Portfolio/mcp-server/index.js"
      ],
      "env": {
        "PORTFOLIO_SUPABASE_URL": "",
        "PORTFOLIO_SUPABASE_ANON_KEY": ""
      }
    }
  }
}
```

---

### 2. Claude Desktop

Add the following to your `claude_desktop_config.json`:

- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "jc-portfolio": {
      "command": "node",
      "args": [
        "C:/Users/Joseph Clyde/OneDrive/Desktop/Cloy's/Cloy's Project/Portfolio/mcp-server/index.js"
      ]
    }
  }
}
```

---

### 3. Cursor / Windsurf

In Cursor/Windsurf settings under **Features > MCP**:
- **Name**: `jc-portfolio`
- **Type**: `stdio`
- **Command**: `node "C:/Users/Joseph Clyde/OneDrive/Desktop/Cloy's/Cloy's Project/Portfolio/mcp-server/index.js"`

---

## 🧪 Testing the MCP Server

You can run the MCP server directly in stdio mode:

```bash
npm start
```

Or test tool execution using standard JSON-RPC protocol requests.
