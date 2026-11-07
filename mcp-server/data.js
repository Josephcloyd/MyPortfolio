import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(here, ".env"), quiet: true });

// The website's content.js is the single source of truth, so AI assistants see exactly what the site shows.
const CONTENT_FILE = path.resolve(here, process.env.PORTFOLIO_CONTENT_FILE || "../content.js");
const SITE_URL = (process.env.PORTFOLIO_SITE_URL || "").replace(/\/+$/, "");

let supabaseClient = null;
const url = process.env.PORTFOLIO_SUPABASE_URL;
const key = process.env.PORTFOLIO_SUPABASE_ANON_KEY;
if (url && key) {
  try {
    supabaseClient = createClient(url, key);
  } catch (err) {
    console.error("Failed to initialize Supabase client in MCP server:", err.message);
  }
}

// Re-read on every call so edits to content.js show up without restarting the server.
export function loadContent() {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(CONTENT_FILE, "utf8"), sandbox, { filename: CONTENT_FILE });
  return sandbox.window.PORTFOLIO_CONTENT || {};
}

function slug(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function projectItem(project, featuredDefault) {
  return {
    id: project.id,
    type: "project",
    title: project.title,
    category: project.category || "",
    subtitle: project.tagline || "",
    description: project.summary || "",
    tags: project.tech || [],
    featured: Boolean(project.featured ?? featuredDefault),
    status: project.status || "",
    overview: project.overview || "",
    challenge: project.problem || "",
    solution: project.solution || "",
    outcome: project.results || "",
    responsibilities: project.responsibilities || [],
    features: project.features || [],
    challenges: project.challenges || [],
    lessons: project.lessons || "",
    repo: project.repo || "",
    url: project.demo || "",
    case_study: SITE_URL ? `${SITE_URL}/project.html?id=${encodeURIComponent(project.id)}` : ""
  };
}

/** Projects, skills, experience, and education as flat records (the shape the tools and resources expect). */
export async function fetchPortfolioItems() {
  const content = loadContent();
  const items = [
    ...(content.projects || []).map((project) => projectItem(project, false)),
    ...(content.moreProjects || []).map((project) => projectItem(project, false)),
    ...(content.techStack || []).map((group) => ({
      id: `skill-${group.id}`,
      type: "skill",
      title: group.label,
      category: group.label,
      subtitle: "",
      description: group.items.map((item) => item.name).join(", "),
      tags: group.items.map((item) => item.name)
    })),
    ...(content.experience || []).map((job) => ({
      id: `experience-${slug(job.company)}`,
      type: "experience",
      title: [job.role, job.company].filter(Boolean).join(" - "),
      category: job.type || "Experience",
      subtitle: job.period || "",
      description: (job.responsibilities || []).join(" "),
      tags: job.relatedProject ? [job.relatedProject] : []
    })),
    ...(content.education || []).map((entry) => ({
      id: `education-${slug(entry.title)}`,
      type: "education",
      title: entry.title,
      category: "Education",
      subtitle: [entry.place, entry.note].filter(Boolean).join(" · "),
      description: "",
      tags: []
    }))
  ];

  // Certificates are managed in the Supabase admin, so they are only available when it is configured.
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from("portfolio_items").select("*").eq("type", "certificate").eq("published", true).order("sort_order", { ascending: true });
      if (!error && data) items.push(...data.map((cert) => ({ id: cert.id, type: "certificate", title: cert.title, category: cert.category || "", subtitle: cert.subtitle || "", description: cert.description || "", tags: cert.tags || [], url: cert.url || "" })));
    } catch (err) {
      console.error("Supabase certificate fetch failed in MCP server:", err.message);
    }
  }
  return items;
}

export async function fetchOverview() {
  const content = loadContent();
  const items = await fetchPortfolioItems();
  const profile = content.profile || {};
  const contact = content.contact || {};
  return {
    developer: profile.name,
    role: (profile.headline || []).join(" · "),
    availability: profile.availability || "",
    bio: profile.intro || "",
    about: (content.about || {}).paragraphs || [],
    contact: {
      email: contact.email || "",
      location: contact.location || "",
      github: (content.socials || {}).github || "",
      linkedin: (content.socials || {}).linkedin || "",
      website: SITE_URL
    },
    summary: {
      total_items: items.length,
      featured_projects: items.filter((i) => i.type === "project" && i.featured).map((p) => p.title),
      skill_categories: items.filter((i) => i.type === "skill").map((s) => s.title),
      experience_highlights: items.filter((i) => i.type === "experience").map((e) => `${e.title} (${e.subtitle})`)
    }
  };
}
