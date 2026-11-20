// Builds the public deployment package in dist/. No dependencies; runs on Windows, macOS, Linux, and Vercel.
//
//   node scripts/build.mjs [--out=dist] [--site-url=https://example.com]
//
// The public site URL (for canonical tags, absolute Open Graph URLs, sitemap.xml, and structured data) comes from,
// in order: --site-url, the SITE_URL env var, publicSiteUrl in supabase-config.js, then Vercel's production domain.
// It also pre-renders the home page sections (templates.js), so crawlers that skip JavaScript see the full content.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = Object.fromEntries(process.argv.slice(2).map((arg) => arg.replace(/^--/, "").split("=")).map(([key, ...rest]) => [key, rest.join("=")]));
const out = path.resolve(root, args.out || "dist");

const publicFiles = [
  "index.html", "admin.html", "project.html", "resume.html", "privacy.html", "security.html", "404.html",
  "styles.css", "effects.css", "admin.css", "favicon.svg", "favicon.ico", "og.png", "manifest.json", "_headers", "robots.txt", "vercel.json",
  "theme-init.js", "content.js", "brand-icons.js", "icons.js", "templates.js", "site.js", "carousel.js", "home.js", "tech-sphere.js", "effects.js", "project-view.js", "resume.js", "contact.js",
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

// content.js, the icons, and the shared templates run in one sandbox so the build renders exactly what the browser would.
const globals = loadGlobals(["content.js", "brand-icons.js", "icons.js", "templates.js"]);
const content = globals.PORTFOLIO_CONTENT || {};
const templates = globals.PortfolioTemplates;
const site = loadGlobals(["supabase-config.js"]).PORTFOLIO_SITE || {};
const vercelDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const siteUrl = (args["site-url"] || process.env.SITE_URL || site.publicSiteUrl || (vercelDomain ? `https://${vercelDomain}` : "")).replace(/\/+$/, "");
const personId = siteUrl ? `${siteUrl}/#person` : "#person";

// Pre-render the home page sections into the static HTML, for crawlers and AI bots that don't run JavaScript.
// home.js re-renders the same markup on load and wires up the interactions.
const projects = content.projects || [];
const moreProjects = content.moreProjects || [];
editHtml("index.html", (html) => {
  const sections = {
    "data-hero-tags": templates.heroTags(content.profile || {}),
    "data-socials": templates.socialLinks(content, site),
    "data-about-copy": templates.aboutCopy(content.about),
    "data-timeline": templates.timeline(content.experience, projects, { expandAll: true }),
    "data-project-filters": templates.projectFilters(content.projectFilters, [...projects, ...moreProjects]),
    "data-carousel-track": templates.projectSlides(projects),
    "data-more-projects": templates.moreProjects(moreProjects),
    "data-stack-tabs": templates.stackTabs(content.techStack),
    "data-stack-panels": templates.stackPanels(content.techStack),
    "data-marquee": templates.marquee(content.techStack),
    "data-faq": templates.faq(content.faq),
    "data-contact-list": templates.contactList(content.contact || {})
  };
  for (const [attribute, markup] of Object.entries(sections)) {
    const empty = new RegExp(`(<([a-z]+)\\b[^>]*\\s${attribute}(?=[\\s>])[^>]*>)(</\\2>)`, "g");
    if (!empty.test(html)) throw new Error(`Pre-render: no empty element with ${attribute} in index.html`);
    html = html.replace(empty, (match, open, tag, close) => `${open}${markup}${close}`);
  }
  return html;
});

// Structured data. The Person has one @id across pages so the home page and resume describe the same entity.
const ldScript = (data) => `    <script type="application/ld+json">${JSON.stringify(data).replaceAll("<", "\\u003c")}</script>\n`;
editHtml("index.html", (html) => html.replace("</head>", `${ldScript({ "@context": "https://schema.org", "@graph": [websiteSchema(), personSchema()] })}${ldScript(templates.faqSchema(content.faq))}  </head>`));
editHtml("resume.html", (html) => html.replace("</head>", `${ldScript({ "@context": "https://schema.org", "@graph": [personSchema(), resumePageSchema()] })}  </head>`));

if (siteUrl) {
  const pages = { "index.html": "/", "resume.html": "/resume.html", "privacy.html": "/privacy.html", "security.html": "/security.html" };
  for (const [page, route] of Object.entries(pages)) {
    editHtml(page, (html) => html
      .replace('<meta name="theme-color"', `<link rel="canonical" href="${siteUrl}${route}" />\n    <meta property="og:url" content="${siteUrl}${route}" />\n    <meta name="theme-color"`)
      .replaceAll('content="og.png"', `content="${siteUrl}/og.png"`));
  }
  editHtml("project.html", (html) => html.replaceAll('content="og.png"', `content="${siteUrl}/og.png"`));

  const today = new Date().toISOString().slice(0, 10);
  const routes = ["/", "/resume.html", ...[...projects, ...moreProjects].map((project) => `/project.html?id=${encodeURIComponent(project.id)}`)];
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...routes.map((route) => `  <url><loc>${escapeXml(siteUrl + route)}</loc><lastmod>${today}</lastmod></url>`),
    "</urlset>",
    ""
  ].join("\n");
  fs.writeFileSync(path.join(out, "sitemap.xml"), sitemap);
  fs.appendFileSync(path.join(out, "robots.txt"), `\nSitemap: ${siteUrl}/sitemap.xml\n`);
  fs.writeFileSync(path.join(out, "llms.txt"), llmsTxt());
  console.log(`SEO: pre-rendered sections, JSON-LD, canonical tags, sitemap.xml, and llms.txt generated for ${siteUrl}`);
} else {
  console.warn("No public site URL found. Set publicSiteUrl in supabase-config.js (or pass --site-url) to generate canonical tags, sitemap.xml, and llms.txt.");
}

console.log(`Deployment package created at ${path.relative(root, out) || "."}`);

function absolute(file) { return siteUrl && file ? `${siteUrl}/${file.replace(/^\//, "")}` : undefined; }

function sameAsLinks() {
  return Object.values(content.socials || {}).filter((url) => /^https:\/\//.test(url || ""));
}

function personSchema() {
  const profile = content.profile || {};
  const contact = content.contact || {};
  const sameAs = sameAsLinks();
  const skills = (content.techStack || []).flatMap((group) => group.items.map((item) => item.name));
  const [city, country] = String(contact.location || "").split(",").map((part) => part.trim());
  return {
    "@type": "Person",
    "@id": personId,
    name: profile.name,
    ...((profile.alternateNames || []).length ? { alternateName: profile.alternateNames } : {}),
    givenName: "Joseph Clyde",
    familyName: "Daño",
    jobTitle: "Software Developer",
    description: profile.intro,
    ...(siteUrl ? { url: `${siteUrl}/`, image: absolute(profile.photo || "og.png") } : {}),
    ...(contact.email ? { email: `mailto:${contact.email}` } : {}),
    ...(city ? { address: { "@type": "PostalAddress", addressLocality: city, ...(country ? { addressCountry: country } : {}) } } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    knowsAbout: skills
  };
}

function websiteSchema() {
  return {
    "@type": "WebSite",
    ...(siteUrl ? { "@id": `${siteUrl}/#website`, url: `${siteUrl}/` } : {}),
    // Short, plain name: Google uses it for the site name shown above the result.
    name: (content.profile || {}).name,
    ...(((content.profile || {}).alternateNames || []).length ? { alternateName: content.profile.alternateNames } : {}),
    inLanguage: "en",
    about: { "@id": personId },
    publisher: { "@id": personId }
  };
}

function resumePageSchema() {
  return {
    "@type": "ProfilePage",
    ...(siteUrl ? { "@id": `${siteUrl}/resume.html#page`, url: `${siteUrl}/resume.html` } : {}),
    name: `Resume — ${(content.profile || {}).name}`,
    mainEntity: { "@id": personId }
  };
}

// llms.txt (llmstxt.org): a plain-Markdown summary that AI assistants can read without running the site.
function llmsTxt() {
  const profile = content.profile || {};
  const contact = content.contact || {};
  const line = (label, url, description) => `- [${label}](${url})${description ? `: ${description}` : ""}`;
  const allProjects = [...projects, ...moreProjects];
  return [
    `# ${profile.name}`,
    "",
    // Third person throughout, from the FAQ's "Who is" answer (the on-page intro is first person).
    `> ${(content.faq || [])[0]?.answer || profile.intro}`,
    "",
    `Also written: ${(profile.alternateNames || []).join(", ")}.`,
    "",
    `Status: ${profile.availability}. Contact: ${contact.email}.`,
    "",
    "## Pages",
    "",
    line("Portfolio home", `${siteUrl}/`, "About, experience, projects, tech stack, FAQ, and contact details"),
    line("Resume", `${siteUrl}/resume.html`, "Printable resume"),
    ...(content.resume?.file ? [line("Resume (PDF)", absolute(content.resume.file), "Downloadable resume")] : []),
    "",
    "## Experience",
    "",
    ...(content.experience || []).map((job) => `- ${job.role ? `${job.role}, ` : ""}${job.company} (${job.period})${(job.responsibilities || []).length ? `: ${job.responsibilities.join(" ")}` : ""}`),
    "",
    "## Projects",
    "",
    ...allProjects.map((project) => line(`${project.title} — ${project.tagline}`, `${siteUrl}/project.html?id=${encodeURIComponent(project.id)}`, `${project.summary} Technologies: ${(project.tech || []).join(", ")}.${project.demo ? ` Live: ${project.demo}` : ""}`)),
    "",
    "## Tech stack",
    "",
    ...(content.techStack || []).map((group) => `- ${group.label}: ${group.items.map((item) => item.name).join(", ")}`),
    "",
    "## FAQ",
    "",
    ...(content.faq || []).flatMap((entry) => [`### ${entry.question}`, "", entry.answer, ""]),
    "## Profiles",
    "",
    ...sameAsLinks().map((url) => `- ${url}`),
    ""
  ].join("\n");
}

function loadGlobals(files) {
  const sandbox = { window: {}, URL };
  vm.createContext(sandbox);
  for (const file of files) vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), sandbox, { filename: file });
  return sandbox.window;
}

function editHtml(file, transform) {
  const target = path.join(out, file);
  fs.writeFileSync(target, transform(fs.readFileSync(target, "utf8")));
}

function escapeXml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}
