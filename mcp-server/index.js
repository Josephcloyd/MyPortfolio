import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { fetchPortfolioItems, fetchOverview } from "./data.js";

// Initialize MCP Server
const server = new McpServer({
  name: "jc-portfolio-mcp-server",
  version: "1.0.0",
  description: "Exposes Joseph Clyde's Portfolio projects, skills, and resume data to AI assistants via Model Context Protocol."
});

// Helper: Format item nicely as string text
function formatItem(item) {
  const lines = [
    `Title: ${item.title}`,
    `Type: ${item.type}`,
    `Category: ${item.category}`
  ];
  if (item.subtitle) lines.push(`Subtitle: ${item.subtitle}`);
  if (item.description) lines.push(`Description: ${item.description}`);
  if (item.tags && item.tags.length) lines.push(`Tags: ${item.tags.join(", ")}`);
  if (item.challenge) lines.push(`Challenge: ${item.challenge}`);
  if (item.solution) lines.push(`Solution: ${item.solution}`);
  if (item.outcome) lines.push(`Outcome: ${item.outcome}`);
  return lines.join("\n");
}

// ----------------------------------------------------
// RESOURCES
// ----------------------------------------------------

// 1. Overview Resource
server.resource(
  "portfolio-overview",
  "portfolio://overview",
  async (uri) => {
    const overview = await fetchOverview();
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(overview, null, 2)
        }
      ]
    };
  }
);

// 2. Projects Resource
server.resource(
  "portfolio-projects",
  "portfolio://projects",
  async (uri) => {
    const items = await fetchPortfolioItems();
    const projects = items.filter((i) => i.type === "project");
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(projects, null, 2)
        }
      ]
    };
  }
);

// 3. Skills Resource
server.resource(
  "portfolio-skills",
  "portfolio://skills",
  async (uri) => {
    const items = await fetchPortfolioItems();
    const skills = items.filter((i) => i.type === "skill");
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(skills, null, 2)
        }
      ]
    };
  }
);

// 4. Resume Resource
server.resource(
  "portfolio-resume",
  "portfolio://resume",
  async (uri) => {
    const items = await fetchPortfolioItems();
    const timeline = items.filter((i) => i.type === "experience");
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(timeline, null, 2)
        }
      ]
    };
  }
);

// 5. All Items Resource
server.resource(
  "portfolio-items",
  "portfolio://items",
  async (uri) => {
    const items = await fetchPortfolioItems();
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(items, null, 2)
        }
      ]
    };
  }
);

// ----------------------------------------------------
// TOOLS
// ----------------------------------------------------

// 1. Get Portfolio Overview Tool
server.tool(
  "get_portfolio_overview",
  "Get high-level overview of Joseph Clyde's portfolio including developer bio, role, and summary stats.",
  {},
  async () => {
    const overview = await fetchOverview();
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(overview, null, 2)
        }
      ]
    };
  }
);

// 2. List Projects Tool
server.tool(
  "list_projects",
  "Filter and list portfolio projects by category, tag, or featured status.",
  {
    category: z.string().optional().describe("Filter by category e.g. Full-stack, Automation, Supabase, WordPress, Embedded, Research"),
    tag: z.string().optional().describe("Filter by technology tag e.g. Excel, AI planning, Bot, ESP32"),
    featured_only: z.boolean().optional().describe("If true, only return featured showcase projects")
  },
  async ({ category, tag, featured_only }) => {
    let items = await fetchPortfolioItems();
    let projects = items.filter((i) => i.type === "project");

    if (category) {
      const catLower = category.toLowerCase();
      projects = projects.filter((p) => p.category && p.category.toLowerCase().includes(catLower));
    }
    if (tag) {
      const tagLower = tag.toLowerCase();
      projects = projects.filter((p) => p.tags && p.tags.some((t) => t.toLowerCase().includes(tagLower)));
    }
    if (featured_only) {
      projects = projects.filter((p) => p.featured);
    }

    if (projects.length === 0) {
      return {
        content: [{ type: "text", text: "No matching projects found." }]
      };
    }

    const resultText = projects.map(formatItem).join("\n\n---\n\n");
    return {
      content: [{ type: "text", text: resultText }]
    };
  }
);

// 3. Get Project Details Tool
server.tool(
  "get_project_details",
  "Fetch full details (challenge, solution, outcome, tech stack) for a specific project by ID or title query.",
  {
    project_id_or_title: z.string().describe("Project ID (e.g. project-lifeplan) or keyword in the title (e.g. LifePlan, WhatsApp, HR)")
  },
  async ({ project_id_or_title }) => {
    const items = await fetchPortfolioItems();
    const query = project_id_or_title.toLowerCase();

    const match = items.find(
      (i) => i.type === "project" && (i.id.toLowerCase() === query || i.title.toLowerCase().includes(query))
    );

    if (!match) {
      return {
        content: [{ type: "text", text: `Project '${project_id_or_title}' not found.` }]
      };
    }

    return {
      content: [{ type: "text", text: formatItem(match) }]
    };
  }
);

// 4. Search Skills Tool
server.tool(
  "search_skills",
  "Search technical skills by category or technology keyword.",
  {
    category: z.string().optional().describe("Category e.g. Web, AI, Data, IoT"),
    keyword: z.string().optional().describe("Keyword e.g. Python, Ollama, Supabase, ESP32, MCP")
  },
  async ({ category, keyword }) => {
    let items = await fetchPortfolioItems();
    let skills = items.filter((i) => i.type === "skill");

    if (category) {
      const catLower = category.toLowerCase();
      skills = skills.filter((s) => s.category && s.category.toLowerCase().includes(catLower));
    }
    if (keyword) {
      const kwLower = keyword.toLowerCase();
      skills = skills.filter(
        (s) =>
          s.title.toLowerCase().includes(kwLower) ||
          s.description.toLowerCase().includes(kwLower) ||
          (s.tags && s.tags.some((t) => t.toLowerCase().includes(kwLower)))
      );
    }

    if (skills.length === 0) {
      return {
        content: [{ type: "text", text: "No matching skills found." }]
      };
    }

    const resultText = skills.map(formatItem).join("\n\n---\n\n");
    return {
      content: [{ type: "text", text: resultText }]
    };
  }
);

// 5. Get Resume Tool
server.tool(
  "get_resume",
  "Retrieve Joseph Clyde's education, experience, and timeline entries.",
  {},
  async () => {
    const items = await fetchPortfolioItems();
    const timeline = items.filter((i) => i.type === "experience");
    const resultText = timeline.map(formatItem).join("\n\n---\n\n");
    return {
      content: [{ type: "text", text: resultText }]
    };
  }
);

// 6. Query Portfolio Tool
server.tool(
  "query_portfolio",
  "Perform a free-text search across all portfolio projects, skills, and experience items.",
  {
    query: z.string().describe("Free text search query e.g. 'Excel automation', 'embedded systems', 'Ollama LLM'")
  },
  async ({ query }) => {
    const items = await fetchPortfolioItems();
    const qLower = query.toLowerCase();

    const matches = items.filter((i) => {
      const textToSearch = [
        i.title,
        i.category,
        i.subtitle,
        i.description,
        (i.tags || []).join(" "),
        i.challenge,
        i.solution,
        i.outcome
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return textToSearch.includes(qLower);
    });

    if (matches.length === 0) {
      return {
        content: [{ type: "text", text: `No portfolio items matched the query '${query}'.` }]
      };
    }

    const resultText = matches.map(formatItem).join("\n\n---\n\n");
    return {
      content: [{ type: "text", text: resultText }]
    };
  }
);

// Start the server using Stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("JC Portfolio MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error starting JC Portfolio MCP Server:", error);
  process.exit(1);
});
