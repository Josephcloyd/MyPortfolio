import { fetchOverview, fetchPortfolioItems } from "./data.js";

async function runTest() {
  console.log("=== Testing MCP Data Module ===");
  const overview = await fetchOverview();
  console.log("Overview:", JSON.stringify(overview, null, 2));

  const items = await fetchPortfolioItems();
  console.log(`\nFetched ${items.length} portfolio items.`);

  const projects = items.filter((i) => i.type === "project");
  console.log(`Projects count: ${projects.length}`);

  const skills = items.filter((i) => i.type === "skill");
  console.log(`Skills count: ${skills.length}`);

  const experience = items.filter((i) => i.type === "experience");
  console.log(`Experience count: ${experience.length}`);

  console.log("\nSample Project:", projects[0]?.title);
  console.log("Sample Skill:", skills[0]?.title);
  console.log("\n✅ Test completed successfully!");
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
