// Local preview server. No dependencies.
//
//   node scripts/serve.mjs            serves the project folder at http://localhost:8080
//   node scripts/serve.mjs --dist     serves the built dist/ folder (run the build first)
//   node scripts/serve.mjs --port=3000
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const root = args.includes("--dist") ? path.join(projectRoot, "dist") : projectRoot;
const port = Number((args.find((arg) => arg.startsWith("--port=")) || "").split("=")[1]) || 8080;
const types = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".jpg": "image/jpeg",
  ".woff2": "font/woff2", ".pdf": "application/pdf", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml"
};

if (!fs.existsSync(root)) { console.error(`Nothing to serve at ${root}. Run "npm run build" first.`); process.exit(1); }

http.createServer((request, response) => {
  let pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  if (pathname.endsWith("/")) pathname += "index.html";
  const file = path.join(root, pathname);
  if (!file.startsWith(root)) { response.writeHead(403); response.end(); return; }
  fs.readFile(file, (error, data) => {
    if (error) {
      response.writeHead(404, { "Content-Type": types[".html"] });
      fs.createReadStream(path.join(root, "404.html")).on("error", () => response.end("Not found")).pipe(response);
      return;
    }
    response.writeHead(200, { "Content-Type": types[path.extname(file).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-store" });
    response.end(data);
  });
}).listen(port, () => console.log(`Serving ${path.relative(projectRoot, root) || "project"} at http://localhost:${port}`));
