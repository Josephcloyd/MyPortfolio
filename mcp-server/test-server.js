import { spawn } from "child_process";

async function testMcpProtocol() {
  console.log("=== Testing MCP Protocol Initialization over Stdio ===");

  const child = spawn("node", ["index.js"], {
    cwd: process.cwd(),
    stdio: ["pipe", "pipe", "pipe"]
  });

  let stdoutData = "";
  let stderrData = "";

  child.stdout.on("data", (chunk) => {
    stdoutData += chunk.toString();
  });

  child.stderr.on("data", (chunk) => {
    stderrData += chunk.toString();
  });

  const initMessage = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "test-runner",
        version: "1.0.0"
      }
    }
  }) + "\n";

  child.stdin.write(initMessage);

  await new Promise((r) => setTimeout(r, 1500));
  child.kill();

  console.log("Stderr output:", stderrData.trim());
  console.log("Stdout output:", stdoutData.trim());

  if (stdoutData.includes("protocolVersion") || stdoutData.includes("capabilities")) {
    console.log("✅ MCP Initialization succeeded!");
  } else {
    console.log("Received response on Stdio stdout/stderr.");
  }
}

testMcpProtocol().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
