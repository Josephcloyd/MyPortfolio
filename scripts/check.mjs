// Checks content.js and the HTML pages before you publish. No dependencies.
//
//   node scripts/check.mjs
//
// Errors (exit code 1): broken file references, duplicate ids, unsafe links, unknown icon keys.
// Reminders: TODO notes and content that is still missing (screenshots, repo/demo links, profiles).
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const reminders = [];

const sandbox = { window: {} };
for (const file of ["content.js", "brand-icons.js"]) vm.runInNewContext(fs.readFileSync(path.join(root, file), "utf8"), sandbox, { filename: file });
const content = sandbox.window.PORTFOLIO_CONTENT || {};
const brandIcons = sandbox.window.PORTFOLIO_BRAND_ICONS || {};

const exists = (relative) => fs.existsSync(path.join(root, relative.replace(/^\//, "").split(/[?#]/)[0]));
const isHttps = (url) => /^https:\/\/[^\s]+$/.test(url);

/* content.js ---------------------------------------------------------------- */
const projects = [...(content.projects || []), ...(content.moreProjects || [])];
const ids = new Set();
const filterIds = new Set((content.projectFilters || []).map((filter) => filter.id));
for (const project of projects) {
  const label = project.id || project.title || "(untitled project)";
  if (!/^project-[a-z0-9-]+$/.test(project.id || "")) errors.push(`${label}: id must look like "project-name" (lowercase letters, numbers, dashes).`);
  if (ids.has(project.id)) errors.push(`${label}: duplicate project id.`);
  ids.add(project.id);
  for (const field of ["title", "tagline", "summary"]) if (!project[field]) errors.push(`${label}: "${field}" is empty.`);
  for (const group of project.groups || []) if (!filterIds.has(group)) errors.push(`${label}: group "${group}" has no matching entry in projectFilters.`);
  for (const image of [project.image, project.illustration, ...(project.gallery || [])].filter(Boolean)) {
    if (!isHttps(image) && !exists(image)) errors.push(`${label}: image file not found: ${image}`);
  }
  for (const field of ["repo", "demo"]) if (project[field] && !isHttps(project[field])) errors.push(`${label}: "${field}" must be a full https:// URL.`);
  if (!project.image && !(project.gallery || []).length) reminders.push(`${project.title}: no real screenshot or photo yet${project.illustration ? " (showing an illustration)" : ""}.`);
  if (!project.repo && !project.demo && (content.projects || []).includes(project)) reminders.push(`${project.title}: no repository or live demo link.`);
}

for (const job of content.experience || []) {
  if (job.relatedProject && !ids.has(job.relatedProject)) errors.push(`Experience "${job.company}": relatedProject "${job.relatedProject}" does not exist.`);
}

for (const group of content.techStack || []) {
  for (const item of group.items || []) if (item.icon && !brandIcons[item.icon]) errors.push(`Tech stack "${item.name}": icon "${item.icon}" is not in brand-icons.js.`);
}

for (const [name, url] of Object.entries(content.socials || {})) {
  if (url && !isHttps(url)) errors.push(`socials.${name} must be a full https:// URL.`);
  if (!url) reminders.push(`socials.${name} is empty, so that profile link is hidden.`);
}
const profile = content.profile || {};
for (const field of ["photo", "avatar"]) if (profile[field] && !exists(profile[field])) errors.push(`profile.${field}: file not found: ${profile[field]}`);
if (content.resume?.file && !exists(content.resume.file)) errors.push(`resume.file not found: ${content.resume.file}`);

const todoLines = fs.readFileSync(path.join(root, "content.js"), "utf8").split(/\r?\n/)
  .map((line, index) => ({ line: index + 1, text: line.trim() }))
  .filter((entry) => /\/\/\s*TODO/.test(entry.text));
for (const todo of todoLines) reminders.push(`content.js:${todo.line} ${todo.text.replace(/^\/\/\s*/, "")}`);

/* HTML pages ---------------------------------------------------------------- */
for (const page of fs.readdirSync(root).filter((file) => file.endsWith(".html"))) {
  const html = fs.readFileSync(path.join(root, page), "utf8");
  for (const [, reference] of html.matchAll(/\s(?:src|href)="([^"]+)"/g)) {
    if (/^(https?:|mailto:|tel:|data:|#|javascript:)/.test(reference) || reference === "/") continue;
    if (!exists(reference)) errors.push(`${page}: missing file "${reference}".`);
  }
}

/* Report ---------------------------------------------------------------------- */
if (reminders.length) {
  console.log(`\nStill to do (${reminders.length}):`);
  reminders.forEach((reminder) => console.log(`  - ${reminder}`));
}
if (errors.length) {
  console.error(`\nErrors (${errors.length}):`);
  errors.forEach((error) => console.error(`  x ${error}`));
  process.exit(1);
}
console.log(`\nContent check passed: ${projects.length} projects, ${(content.experience || []).length} roles, ${(content.techStack || []).length} stack groups.`);
