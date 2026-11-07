// Builds the public deployment package in dist/. No dependencies; runs on Windows, macOS, Linux, and Vercel.
//
//   node scripts/build.mjs [--out=dist] [--site-url=https://example.com]
//
// The public site URL (for canonical tags, absolute Open Graph URLs, sitemap.xml, and structured data) comes from,
// in order: --site-url, the SITE_URL env var, publicSiteUrl in supabase-config.js, then Vercel's production domain.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = Object.fromEntries(process.argv.slice(2).map((arg) => arg.replace(/^--/, "").split("=")).map(([key, ...rest]) => [key, rest.join("=")]));
const out = path.resolve(root, args.out || "dist");

const publicFiles = [
  "index.html", "admin.html", "project.html", "resume.html", "privacy.html", "security.html", "404.html",
  "styles.css", "effects.css", "admin.css", "favicon.svg", "og.png", "manifest.json", "_headers", "robots.txt", "vercel.json",
  "theme-init.js", "content.js", "brand-icons.js", "icons.js", "site.js", "carousel.js", "home.js", "tech-sphere.js", "effects.js", "project-view.js", "resume.js", "contact.js",
  "supabase-config.js", "security.js", "portfolio-data.js", "admin.js"
];
const publicDirectories = ["fonts", "images", "vendor", ".well-known"];

// SQL, Edge Function source, docs, scripts, and the MCP server are never copied.
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const file of publicFiles) {
  const source = path.join(root, file);
  if (!fs.existsSync(source)) throw new Error(`Missing public file: ${file}`);
  fs.copyFileSync(source, path.join(out, file));
}
for (const directory of publicDirectories) {
  const source = path.join(root, directory);
  if (fs.existsSync(source)) fs.cpSync(source, path.join(out, directory), { recursive: true });
}
for (const file of fs.readdirSync(root)) {
  if (file.toLowerCase().endsWith(".pdf")) fs.copyFileSync(path.join(root, file), path.join(out, file));
}

const content = loadGlobals("content.js").PORTFOLIO_CONTENT || {};
const site = loadGlobals("supabase-config.js").PORTFOLIO_SITE || {};
const vercelDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const siteUrl = (args["site-url"] || process.env.SITE_URL || site.publicSiteUrl || (vercelDomain ? `https://${vercelDomain}` : "")).replace(/\/+$/, "");

// Structured data so search engines can show a proper profile result.
editHtml("index.html", (html) => html.replace("</head>", `    <script type="application/ld+json">${JSON.stringify(personSchema()).replaceAll("<", "\\u003c")}</script>\n  </head>`));

if (siteUrl) {
  const pages = { "index.html": "/", "resume.html": "/resume.html", "privacy.html": "/privacy.html", "security.html": "/security.html" };
  for (const [page, route] of Object.entries(pages)) {
    editHtml(page, (html) => html
      .replace('<meta name="theme-color"', `<link rel="canonical" href="${siteUrl}${route}" />\n    <meta property="og:url" content="${siteUrl}${route}" />\n    <meta name="theme-color"`)
      .replaceAll('content="og.png"', `content="${siteUrl}/og.png"`));
  }
  editHtml("project.html", (html) => html.replaceAll('content="og.png"', `content="${siteUrl}/og.png"`));

  const today = new Date().toISOString().slice(0, 10);
  const projects = [...(content.projects || []), ...(content.moreProjects || [])];
  const routes = ["/", "/resume.html", ...projects.map((project) => `/project.html?id=${encodeURIComponent(project.id)}`)];
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...routes.map((route) => `  <url><loc>${escapeXml(siteUrl + route)}</loc><lastmod>${today}</lastmod></url>`),
    "</urlset>",
    ""
  ].join("\n");
  fs.writeFileSync(path.join(out, "sitemap.xml"), sitemap);
  fs.appendFileSync(path.join(out, "robots.txt"), `\nSitemap: ${siteUrl}/sitemap.xml\n`);
  console.log(`SEO: canonical tags, absolute Open Graph URLs, and sitemap.xml generated for ${siteUrl}`);
} else {
  console.warn("No public site URL found. Set publicSiteUrl in supabase-config.js (or pass --site-url) to generate canonical tags and sitemap.xml.");
}

console.log(`Deployment package created at ${path.relative(root, out) || "."}`);

function personSchema() {
  const profile = content.profile || {};
  const contact = content.contact || {};
  const sameAs = Object.values(content.socials || {}).filter((url) => /^https:\/\//.test(url || ""));
  const skills = (content.techStack || []).flatMap((group) => group.items.map((item) => item.name));
  const [city, country] = String(contact.location || "").split(",").map((part) => part.trim());
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: (profile.headline || [])[0],
    description: profile.intro,
    ...(siteUrl ? { url: `${siteUrl}/`, image: `${siteUrl}/${profile.photo || "og.png"}` } : {}),
    ...(contact.email ? { email: `mailto:${contact.email}` } : {}),
    ...(city ? { address: { "@type": "PostalAddress", addressLocality: city, ...(country ? { addressCountry: country } : {}) } } : {}),
    ...((content.education || [])[0] ? { alumniOf: { "@type": "CollegeOrUniversity", name: content.education[0].place } } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    knowsAbout: skills
  };
}

function loadGlobals(file) {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, file), "utf8"), sandbox, { filename: file });
  return sandbox.window;
}

function editHtml(file, transform) {
  const target = path.join(out, file);
  fs.writeFileSync(target, transform(fs.readFileSync(target, "utf8")));
}

function escapeXml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}
