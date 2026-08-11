import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

export const starterItems = [
  {
    id: "skill-web",
    type: "skill",
    title: "Software and Web Development",
    category: "Web",
    subtitle: "",
    description: "Python fundamentals, JavaScript, TypeScript, Next.js, React, Node.js, Express, HTML, CSS, REST APIs, Git, GitHub, and WordPress development.",
    tags: ["Python", "TypeScript", "React", "Node.js", "WordPress"],
    sort_order: 10,
    featured: true,
    published: true
  },
  {
    id: "skill-ai",
    type: "skill",
    title: "AI and Automation",
    category: "AI",
    subtitle: "",
    description: "AI chatbot development, local LLM integration with Ollama, prompt engineering, MCP server development, WhatsApp bots, Excel generation, and workflow automation.",
    tags: ["Ollama", "Chatbots", "MCP", "WhatsApp", "Automation"],
    sort_order: 20,
    featured: true,
    published: true
  },
  {
    id: "skill-data",
    type: "skill",
    title: "Database and Backend",
    category: "Data",
    subtitle: "",
    description: "Supabase, PostgreSQL, SQL, schema design, authentication relationships, Row Level Security concepts, file storage, signed URLs, and backend validation.",
    tags: ["Supabase", "PostgreSQL", "SQL", "Auth", "RLS"],
    sort_order: 30,
    featured: true,
    published: true
  },
  {
    id: "skill-iot",
    type: "skill",
    title: "Hardware and Embedded Systems",
    category: "IoT",
    subtitle: "",
    description: "ESP32, ESP32-CAM, Arduino development, RFID module integration, sensors, serial communication, and basic electronics prototyping.",
    tags: ["ESP32", "RFID", "Arduino", "Sensors"],
    sort_order: 40,
    featured: true,
    published: true
  },
  {
    id: "project-lifeplan",
    type: "project",
    title: "LifePlan: AI Production Planning System",
    category: "Full-stack",
    subtitle: "AI planning and Excel automation",
    description: "A dashboard that turns natural-language requests into structured production plans, schedules, staffing estimates, risk notes, and downloadable Excel workbooks.",
    tags: ["AI planning", "Excel", "Dashboard"],
    sort_order: 10,
    featured: true,
    challenge: "Production requirements arrived in unstructured messages and took too long to convert into usable plans.",
    solution: "Designed a guided dashboard and planning pipeline that converts requests into validated schedules, resource estimates, and workbook-ready data.",
    outcome: "Reduced manual planning steps and produced consistent, exportable outputs for operational review.",
    published: true
  },
  {
    id: "project-whatsapp",
    type: "project",
    title: "WhatsApp Production Planner Bot",
    category: "Automation",
    subtitle: "Messaging workflow",
    description: "A chatbot connected to a planning backend that accepts project requirements and returns generated plans and workbook links through WhatsApp.",
    tags: ["Bot", "Workflow", "Backend"],
    sort_order: 20,
    featured: false,
    challenge: "Planning requests needed to be accessible without opening a separate dashboard.",
    solution: "Connected a conversational intake flow to the planning service and returned structured summaries and workbook links in chat.",
    outcome: "Made the planning workflow available from a familiar mobile channel.",
    published: true
  },
  {
    id: "project-hr",
    type: "project",
    title: "HR Employee Management System",
    category: "Supabase",
    subtitle: "Business system",
    description: "A platform covering employee records, attendance, leave credits, requests, requisitions, file storage, and organizational relationships.",
    tags: ["Supabase", "Auth", "Records"],
    sort_order: 30,
    featured: false,
    challenge: "Employee information and approvals were fragmented across multiple manual records.",
    solution: "Created a relational Supabase-backed system with role-aware records, storage, requests, and organizational links.",
    outcome: "Centralized operational HR data and clarified common employee workflows.",
    published: true
  },
  {
    id: "project-seo",
    type: "project",
    title: "SEO WordPress Capstone",
    category: "WordPress",
    subtitle: "SEO implementation",
    description: "A capstone build demonstrating WordPress development with on-page, off-page, and technical SEO practices for a more discoverable website.",
    tags: ["WordPress", "SEO", "Capstone"],
    sort_order: 40,
    featured: false,
    challenge: "The site needed a stronger technical and content foundation for organic discovery.",
    solution: "Implemented page structure, metadata, performance basics, and a practical on-page and off-page SEO plan.",
    outcome: "Delivered a complete capstone demonstrating an end-to-end SEO workflow.",
    published: true
  },
  {
    id: "project-esp32",
    type: "project",
    title: "ESP32-CAM and RFID Prototype",
    category: "Embedded",
    subtitle: "Hardware integration",
    description: "An embedded systems prototype focused on hardware integration, serial communication, RFID scanning, camera setup, and systematic troubleshooting.",
    tags: ["ESP32", "RFID", "Camera"],
    sort_order: 50,
    featured: false,
    challenge: "Multiple hardware modules needed stable communication under constrained power and serial connections.",
    solution: "Integrated the camera and RFID components incrementally, testing power, pins, serial output, and module behavior at each step.",
    outcome: "Produced a working prototype and a repeatable hardware troubleshooting process.",
    published: true
  },
  {
    id: "project-canal",
    type: "project",
    title: "Canal Guard Cebu: Proposed Capstone",
    category: "Research",
    subtitle: "Community technology",
    description: "A future capstone concept focused on practical environmental or community-driven technology, currently in research and proposal development.",
    tags: ["Research", "Community", "Capstone"],
    sort_order: 60,
    featured: false,
    challenge: "Local canal monitoring and response can lack accessible, timely environmental data.",
    solution: "Exploring a sensor-assisted community monitoring concept with practical alerts and maintainable field hardware.",
    outcome: "Research phase: defining feasibility, stakeholders, and a testable capstone scope.",
    published: true
  },
  {
    id: "timeline-cpe",
    type: "experience",
    title: "BS Computer Engineering",
    category: "Education",
    subtitle: "Current",
    description: "Developing foundations in software, electronics, embedded systems, networking, and engineering problem solving.",
    tags: ["Education", "CPE"],
    sort_order: 10,
    published: true
  },
  {
    id: "timeline-builder",
    type: "experience",
    title: "Independent Project Builder",
    category: "Experience",
    subtitle: "Ongoing",
    description: "Designing and shipping portfolio projects across web development, AI workflows, Supabase systems, and connected hardware.",
    tags: ["Projects", "Fullstack"],
    sort_order: 20,
    published: true
  },
  {
    id: "timeline-focus",
    type: "experience",
    title: "Applied Systems Practice",
    category: "Focus",
    subtitle: "2025–2026",
    description: "Turning coursework and self-directed learning into tools that model real operational workflows.",
    tags: ["Systems", "Workflow"],
    sort_order: 30,
    published: true
  }
];

let supabaseClient = null;
const url = process.env.PORTFOLIO_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.PORTFOLIO_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (url && key) {
  try {
    supabaseClient = createClient(url, key);
  } catch (err) {
    console.error("Failed to initialize Supabase client in MCP server:", err.message);
  }
}

export async function fetchPortfolioItems() {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from("portfolio_items")
        .select("*")
        .eq("published", true)
        .order("sort_order", { ascending: true });
      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.warn("Supabase fetch failed in MCP server, returning local fallback starter data:", err.message);
    }
  }
  return starterItems.filter((item) => item.published);
}

export async function fetchOverview() {
  const items = await fetchPortfolioItems();
  const featuredProjects = items.filter((i) => i.type === "project" && i.featured);
  const skills = items.filter((i) => i.type === "skill");
  const experience = items.filter((i) => i.type === "experience");

  return {
    developer: "Joseph Clyde",
    role: "Computer Engineering Student & Full-Stack / AI Systems Developer",
    bio: "Passionate project builder focusing on web development, AI automation workflows, local LLMs, Supabase backends, and embedded hardware systems.",
    summary: {
      total_items: items.length,
      featured_projects: featuredProjects.map((p) => p.title),
      skill_categories: [...new Set(skills.map((s) => s.category))],
      experience_highlights: experience.map((e) => `${e.title} (${e.category}: ${e.subtitle})`)
    }
  };
}
