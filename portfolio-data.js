(function () {
  const STORAGE_KEY = "jc-portfolio-items";
  const MESSAGE_KEY = "jc-portfolio-messages";

  const starterItems = [
    item("skill-web", "skill", "Software and Web Development", "Web", "Python fundamentals, JavaScript, TypeScript, Next.js, React, Node.js, Express, HTML, CSS, REST APIs, Git, GitHub, and WordPress development.", ["Python", "TypeScript", "React", "Node.js", "WordPress"], 10, true),
    item("skill-ai", "skill", "AI and Automation", "AI", "AI chatbot development, local LLM integration with Ollama, prompt engineering, MCP server development, WhatsApp bots, Excel generation, and workflow automation.", ["Ollama", "Chatbots", "MCP", "WhatsApp", "Automation"], 20, true),
    item("skill-data", "skill", "Database and Backend", "Data", "Supabase, PostgreSQL, SQL, schema design, authentication relationships, Row Level Security concepts, file storage, signed URLs, and backend validation.", ["Supabase", "PostgreSQL", "SQL", "Auth", "RLS"], 30, true),
    item("skill-iot", "skill", "Hardware and Embedded Systems", "IoT", "ESP32, ESP32-CAM, Arduino development, RFID module integration, sensors, serial communication, and basic electronics prototyping.", ["ESP32", "RFID", "Arduino", "Sensors"], 40, true),
    project("project-lifeplan", "LifePlan: AI Production Planning System", "Full-stack", "AI planning and Excel automation", "A dashboard that turns natural-language requests into structured production plans, schedules, staffing estimates, risk notes, and downloadable Excel workbooks.", ["AI planning", "Excel", "Dashboard"], 10, true, "Production requirements arrived in unstructured messages and took too long to convert into usable plans.", "Designed a guided dashboard and planning pipeline that converts requests into validated schedules, resource estimates, and workbook-ready data.", "Reduced manual planning steps and produced consistent, exportable outputs for operational review."),
    project("project-whatsapp", "WhatsApp Production Planner Bot", "Automation", "Messaging workflow", "A chatbot connected to a planning backend that accepts project requirements and returns generated plans and workbook links through WhatsApp.", ["Bot", "Workflow", "Backend"], 20, false, "Planning requests needed to be accessible without opening a separate dashboard.", "Connected a conversational intake flow to the planning service and returned structured summaries and workbook links in chat.", "Made the planning workflow available from a familiar mobile channel."),
    project("project-hr", "HR Employee Management System", "Supabase", "Business system", "A platform covering employee records, attendance, leave credits, requests, requisitions, file storage, and organizational relationships.", ["Supabase", "Auth", "Records"], 30, false, "Employee information and approvals were fragmented across multiple manual records.", "Created a relational Supabase-backed system with role-aware records, storage, requests, and organizational links.", "Centralized operational HR data and clarified common employee workflows."),
    project("project-seo", "SEO WordPress Capstone", "WordPress", "SEO implementation", "A capstone build demonstrating WordPress development with on-page, off-page, and technical SEO practices for a more discoverable website.", ["WordPress", "SEO", "Capstone"], 40, false, "The site needed a stronger technical and content foundation for organic discovery.", "Implemented page structure, metadata, performance basics, and a practical on-page and off-page SEO plan.", "Delivered a complete capstone demonstrating an end-to-end SEO workflow."),
    project("project-esp32", "ESP32-CAM and RFID Prototype", "Embedded", "Hardware integration", "An embedded systems prototype focused on hardware integration, serial communication, RFID scanning, camera setup, and systematic troubleshooting.", ["ESP32", "RFID", "Camera"], 50, false, "Multiple hardware modules needed stable communication under constrained power and serial connections.", "Integrated the camera and RFID components incrementally, testing power, pins, serial output, and module behavior at each step.", "Produced a working prototype and a repeatable hardware troubleshooting process."),
    project("project-canal", "Canal Guard Cebu: Proposed Capstone", "Research", "Community technology", "A future capstone concept focused on practical environmental or community-driven technology, currently in research and proposal development.", ["Research", "Community", "Capstone"], 60, false, "Local canal monitoring and response can lack accessible, timely environmental data.", "Exploring a sensor-assisted community monitoring concept with practical alerts and maintainable field hardware.", "Research phase: defining feasibility, stakeholders, and a testable capstone scope."),
    timeline("timeline-cpe", "BS Computer Engineering", "Education", "Current", "Developing foundations in software, electronics, embedded systems, networking, and engineering problem solving.", 10),
    timeline("timeline-builder", "Independent Project Builder", "Experience", "Ongoing", "Designing and shipping portfolio projects across web development, AI workflows, Supabase systems, and connected hardware.", 20),
    timeline("timeline-focus", "Applied Systems Practice", "Focus", "2025–2026", "Turning coursework and self-directed learning into tools that model real operational workflows.", 30)
  ];

  function item(id, type, title, category, description, tags, sortOrder, featured) {
    return normalize({ id, type, title, category, description, tags, sort_order: sortOrder, featured, published: true });
  }

  function project(id, title, category, subtitle, description, tags, sortOrder, featured, challenge, solution, outcome) {
    return normalize({ id, type: "project", title, category, subtitle, description, tags, sort_order: sortOrder, featured, challenge, solution, outcome, published: true });
  }

  function timeline(id, title, category, subtitle, description, sortOrder) {
    return normalize({ id, type: "experience", title, category, subtitle, description, sort_order: sortOrder, published: true });
  }

  function hasSupabaseConfig() {
    const config = window.PORTFOLIO_SUPABASE || {};
    return Boolean(config.url && config.anonKey && window.supabase);
  }

  function client() {
    if (!hasSupabaseConfig()) return null;
    if (!window.__portfolioSupabaseClient) {
      window.__portfolioSupabaseClient = window.supabase.createClient(window.PORTFOLIO_SUPABASE.url, window.PORTFOLIO_SUPABASE.anonKey);
    }
    return window.__portfolioSupabaseClient;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function sortItems(items) {
    return [...items].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0) || String(a.title || "").localeCompare(String(b.title || "")));
  }

  function normalize(item) {
    return {
      id: item.id || cryptoId(),
      type: item.type || "skill",
      title: item.title || "",
      category: item.category || "",
      subtitle: item.subtitle || "",
      description: item.description || "",
      tags: Array.isArray(item.tags) ? item.tags : String(item.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean),
      url: item.url || "",
      image_url: item.image_url || "",
      challenge: item.challenge || "",
      solution: item.solution || "",
      outcome: item.outcome || "",
      publish_at: item.publish_at || null,
      sort_order: Number(item.sort_order || 0),
      featured: Boolean(item.featured),
      published: item.published !== false
    };
  }

  function isVisible(item) {
    return item.published !== false && (!item.publish_at || new Date(item.publish_at).getTime() <= Date.now());
  }

  function cryptoId() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return `item-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function localItems() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return clone(starterItems);
    try { return sortItems(JSON.parse(raw).map(normalize)); } catch (error) { return clone(starterItems); }
  }

  function saveLocalItems(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sortItems(items.map(normalize))));
  }

  async function loadItems(options = {}) {
    const sb = client();
    let items;
    if (!sb) items = localItems();
    else {
      const { data, error } = await sb.from("portfolio_items").select("*").order("sort_order", { ascending: true });
      if (error) {
        console.warn("Supabase load failed. Falling back to local portfolio data.", error);
        items = localItems();
      } else items = data && data.length ? data.map(normalize) : clone(starterItems);
    }
    const sorted = sortItems(items);
    return options.includeDrafts ? sorted : sorted.filter(isVisible);
  }

  async function loadItem(id, options = {}) {
    return (await loadItems(options)).find((entry) => entry.id === id) || null;
  }

  async function saveItem(itemValue) {
    const normalized = normalize(itemValue);
    const sb = client();
    if (!sb) {
      const next = localItems().filter((entry) => entry.id !== normalized.id);
      next.push(normalized);
      saveLocalItems(next);
      return normalized;
    }
    const { data, error } = await sb.from("portfolio_items").upsert(normalized).select().single();
    if (error) throw error;
    return normalize(data);
  }

  async function deleteItem(id) {
    const sb = client();
    if (!sb) { saveLocalItems(localItems().filter((itemValue) => itemValue.id !== id)); return; }
    const { error } = await sb.from("portfolio_items").delete().eq("id", id);
    if (error) throw error;
  }

  async function uploadMedia(file) {
    if (!file || !file.type.startsWith("image/")) throw new Error("Choose an image file first.");
    if (file.size > 5 * 1024 * 1024) throw new Error("Images must be smaller than 5 MB.");
    const sb = client();
    if (!sb) {
      if (file.size > 1.5 * 1024 * 1024) throw new Error("Local preview images must be smaller than 1.5 MB. Supabase mode supports up to 5 MB.");
      return fileToDataUrl(file);
    }
    const { data: authData } = await sb.auth.getUser();
    if (!authData.user) throw new Error("Sign in before uploading media.");
    const cleanName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
    const path = `${authData.user.id}/${Date.now()}-${cleanName}`;
    const { error } = await sb.storage.from("portfolio-media").upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) throw error;
    return sb.storage.from("portfolio-media").getPublicUrl(path).data.publicUrl;
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Could not read that image."));
      reader.readAsDataURL(file);
    });
  }

  async function seedStarterItems() {
    const sb = client();
    if (!sb) { saveLocalItems(clone(starterItems)); return clone(starterItems); }
    const { error } = await sb.from("portfolio_items").upsert(clone(starterItems));
    if (error) throw error;
    return loadItems({ includeDrafts: true });
  }

  function localMessages() {
    try { return JSON.parse(localStorage.getItem(MESSAGE_KEY) || "[]"); } catch (error) { return []; }
  }

  async function submitMessage(message) {
    const record = { id: cryptoId(), name: message.name.trim(), email: message.email.trim(), subject: message.subject.trim(), message: message.message.trim(), status: "new", created_at: new Date().toISOString() };
    if (!record.name || !record.email || !record.message) throw new Error("Name, email, and message are required.");
    const sb = client();
    if (!sb) { localStorage.setItem(MESSAGE_KEY, JSON.stringify([record, ...localMessages()])); return record; }
    const { error } = await sb.from("contact_messages").insert({ name: record.name, email: record.email, subject: record.subject, message: record.message });
    if (error) throw error;
    return record;
  }

  async function loadMessages() {
    const sb = client();
    if (!sb) return localMessages();
    const { data, error } = await sb.from("contact_messages").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function setMessageStatus(id, status) {
    const sb = client();
    if (!sb) {
      localStorage.setItem(MESSAGE_KEY, JSON.stringify(localMessages().map((message) => message.id === id ? { ...message, status } : message)));
      return;
    }
    const { error } = await sb.from("contact_messages").update({ status }).eq("id", id);
    if (error) throw error;
  }

  async function deleteMessage(id) {
    const sb = client();
    if (!sb) { localStorage.setItem(MESSAGE_KEY, JSON.stringify(localMessages().filter((message) => message.id !== id))); return; }
    const { error } = await sb.from("contact_messages").delete().eq("id", id);
    if (error) throw error;
  }

  window.PortfolioStore = { starterItems: clone(starterItems), hasSupabaseConfig, client, loadItems, loadItem, saveItem, deleteItem, uploadMedia, seedStarterItems, submitMessage, loadMessages, setMessageStatus, deleteMessage, normalize, sortItems, isVisible };
})();
