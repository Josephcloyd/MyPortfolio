import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { z } from "zod";
import { fetchPortfolioItems, fetchOverview } from "./data.js";

async function testMcpClient() {
  console.log("=== Testing MCP Tools & Resources via InMemoryTransport ===");

  const server = new McpServer({
    name: "jc-portfolio-test",
    version: "1.0.0"
  });

  server.tool(
    "get_portfolio_overview",
    "Get high-level overview of portfolio.",
    {},
    async () => {
      const overview = await fetchOverview();
      return { content: [{ type: "text", text: JSON.stringify(overview) }] };
    }
  );

  server.tool(
    "list_projects",
    "List projects.",
    { category: z.string().optional() },
    async () => {
      const items = await fetchPortfolioItems();
      const projects = items.filter((i) => i.type === "project");
      return { content: [{ type: "text", text: JSON.stringify(projects) }] };
    }
  );

  const client = new Client(
    { name: "test-client", version: "1.0.0" },
    { capabilities: {} }
  );

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport)
  ]);

  console.log("Connected client to MCP server.");

  const toolsList = await client.listTools();
  console.log("Registered Tools:", toolsList.tools.map((t) => t.name));

  const overviewResult = await client.callTool({ name: "get_portfolio_overview", arguments: {} });
  console.log("\nCall Tool 'get_portfolio_overview' output:", overviewResult.content[0].text);

  const projectsResult = await client.callTool({ name: "list_projects", arguments: {} });
  console.log("\nCall Tool 'list_projects' count:", JSON.parse(projectsResult.content[0].text).length);

  await client.close();
  console.log("\n✅ MCP Client-Server integration test PASSED!");
}

testMcpClient().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
