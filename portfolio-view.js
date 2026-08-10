(async function () {
  const store = window.PortfolioStore;
  const skillsGrid = document.querySelector("#skillsGrid");
  const projectsGrid = document.querySelector("#projectsGrid");
  const certificatesGrid = document.querySelector("#certificatesGrid");
  const timelineGrid = document.querySelector("#timelineGrid");
  const filters = document.querySelector("#projectFilters");
  const projectSearch = document.querySelector("#projectSearch");
  const featuredProject = document.querySelector("#featuredProject");
  const stackMatrix = document.querySelector("#stackMatrix");
  if (!store || !skillsGrid || !projectsGrid || !certificatesGrid) return;

  const items = await store.loadItems();
  const byType = (type) => items.filter((item) => item.type === type);
  const projects = byType("project");
  renderSkills(byType("skill"));
  renderProjects(projects);
  renderFeatured(projects);
  renderStackMatrix(items);
  renderCertificates(byType("certificate"));
  renderTimeline(byType("experience"));
  renderFilters(projects);
  updateCounts();
  document.dispatchEvent(new CustomEvent("portfolio:rendered"));

  function renderSkills(skills) {
    skillsGrid.innerHTML = skills.map((skill, index) => `
      <article class="card depth-card reveal-item floating-card" tabindex="0" role="button" data-modal-card data-modal-kicker="${escapeAttr(skill.category || "Skill")}" data-modal-title="${escapeAttr(skill.title)}" data-modal-description="${escapeAttr(skill.description)}" data-modal-details="${escapeAttr((skill.tags || []).length ? `Core tools: ${skill.tags.join(", ")}` : "Built through practical project work and applied system design.")}" data-modal-tags="${escapeAttr((skill.tags || []).join("|"))}">
        <div class="card-readout"><span class="card-kicker">${escapeHtml(skill.category || "Skill")}</span><small>CAP-${pad(index + 1)}</small></div>
        <h3>${escapeHtml(skill.title)}</h3><p>${escapeHtml(skill.description)}</p>${tags(skill.tags)}
      </article>`).join("");
  }

  function renderProjects(collection) {
    projectsGrid.innerHTML = collection.map((project, index) => `
      <article class="project-card depth-card reveal-item floating-card ${project.featured ? "featured" : ""}" tabindex="0" role="button" data-modal-card data-category="${escapeAttr((project.category || "").toLowerCase())}" data-search="${escapeAttr([project.title, project.category, project.subtitle, project.description, project.stack_summary, ...(project.tags || [])].join(" ").toLowerCase())}" data-modal-kicker="${escapeAttr(project.featured ? "Priority system" : project.category || "Project")}" data-modal-title="${escapeAttr(project.title)}" data-modal-description="${escapeAttr(project.description)}" data-modal-details="${escapeAttr(project.challenge || project.solution || project.outcome ? [project.challenge, project.solution, project.outcome].filter(Boolean).join(" ") : project.subtitle || "Open the full case study for more project context.")}" data-modal-tags="${escapeAttr([project.category, project.subtitle, ...(project.tags || [])].filter(Boolean).join("|"))}" data-modal-link="project.html?id=${encodeURIComponent(project.id)}">
        ${project.image_url ? `<a class="project-media" href="project.html?id=${encodeURIComponent(project.id)}"><img src="${escapeAttr(project.image_url)}" alt="Preview of ${escapeAttr(project.title)}" loading="lazy" /></a>` : `<a class="project-media project-media-fallback" href="project.html?id=${encodeURIComponent(project.id)}" aria-label="Open ${escapeAttr(project.title)} case study"><span>${escapeHtml(project.category || "System")}</span><i></i><i></i><i></i></a>`}
        <div class="card-readout"><span>${project.featured ? "Priority system" : "System node"}</span><small>PRJ-${pad(index + 1)}</small></div>
        ${tags([project.category, project.subtitle].filter(Boolean), "project-meta")}
        <h3>${escapeHtml(project.title)}</h3><p>${escapeHtml(project.description)}</p>
        ${(project.gallery_urls || []).length ? `<span class="media-count">${project.gallery_urls.length} media slot${project.gallery_urls.length === 1 ? "" : "s"}</span>` : ""}
        <a class="text-link" href="project.html?id=${encodeURIComponent(project.id)}">Open case study</a>
      </article>`).join("");
  }

  function renderFilters(collection) {
    if (!filters) return;
    const categories = [...new Set(collection.map((project) => project.category).filter(Boolean))];
    filters.innerHTML = `<button class="filter-button is-active" type="button" data-filter="all">All systems</button>${categories.map((category) => `<button class="filter-button" type="button" data-filter="${escapeAttr(category.toLowerCase())}">${escapeHtml(category)}</button>`).join("")}`;
    filters.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-filter]");
      if (!button) return;
      filters.querySelectorAll("button").forEach((entry) => entry.classList.toggle("is-active", entry === button));
      applyProjectFilters();
    });
    projectSearch?.addEventListener("input", applyProjectFilters);
  }

  function applyProjectFilters() {
    const active = filters?.querySelector(".is-active")?.dataset.filter || "all";
    const query = (projectSearch?.value || "").trim().toLowerCase();
    projectsGrid.querySelectorAll(".project-card").forEach((card) => {
      const matchesCategory = active === "all" || card.dataset.category === active;
      const matchesQuery = !query || card.dataset.search.includes(query);
      card.hidden = !matchesCategory || !matchesQuery;
    });
    projectsGrid.scrollTo({ left: 0, behavior: "smooth" });
  }

  function renderFeatured(projects) {
    if (!featuredProject) return;
    const project = projects.find((entry) => entry.featured) || projects[0];
    if (!project) { featuredProject.innerHTML = `<p>No featured project yet.</p>`; return; }
    const gallery = [project.image_url, ...(project.gallery_urls || [])].filter(Boolean);
    featuredProject.innerHTML = `
      <div class="featured-copy">
        <div class="card-readout"><span>${escapeHtml(project.category || "Featured")}</span><small>${gallery.length ? `${gallery.length} MEDIA` : "SPOTLIGHT"}</small></div>
        <h3>${escapeHtml(project.title)}</h3>
        <p>${escapeHtml(project.description)}</p>
        <dl class="featured-facts">
          <div><dt>Role</dt><dd>${escapeHtml(project.role || "Builder / Developer")}</dd></div>
          <div><dt>Stack</dt><dd>${escapeHtml(project.stack_summary || (project.tags || []).join(", ") || project.subtitle || "Project-specific tools")}</dd></div>
          <div><dt>Outcome</dt><dd>${escapeHtml(project.outcome || "Working project foundation with room to iterate.")}</dd></div>
        </dl>
        <div class="admin-actions"><a class="btn btn-primary" href="project.html?id=${encodeURIComponent(project.id)}">Read Case Study</a>${project.url ? `<a class="btn btn-outline" href="${escapeAttr(project.url)}" target="_blank" rel="noreferrer">Open Project</a>` : ""}</div>
      </div>
      <div class="featured-media">${gallery.length ? gallery.slice(0, 3).map((url, index) => `<img src="${escapeAttr(url)}" alt="${escapeAttr(project.title)} screenshot ${index + 1}" loading="lazy" />`).join("") : `<div class="project-media-fallback"><span>${escapeHtml(project.category || "System")}</span><i></i><i></i><i></i></div>`}</div>`;
  }

  function renderStackMatrix(items) {
    if (!stackMatrix) return;
    const groups = [
      ["Frontend", ["React", "Next.js", "TypeScript", "JavaScript", "HTML", "CSS", "WordPress"]],
      ["Backend & Data", ["Supabase", "PostgreSQL", "SQL", "Node.js", "Express", "REST APIs", "Auth"]],
      ["AI & Automation", ["Ollama", "Chatbots", "MCP", "WhatsApp", "Automation", "Excel"]],
      ["Hardware", ["ESP32", "RFID", "Arduino", "Sensors", "Camera"]]
    ];
    const knownTags = new Set(items.flatMap((entry) => entry.tags || []));
    stackMatrix.innerHTML = groups.map(([group, values]) => {
      const matched = values.filter((value) => knownTags.has(value));
      return `<article><span>${escapeHtml(group)}</span><div class="tag-list">${(matched.length ? matched : values.slice(0, 4)).map((value) => `<span>${escapeHtml(value)}</span>`).join("")}</div></article>`;
    }).join("");
  }

  function renderTimeline(entries) {
    if (!timelineGrid) return;
    timelineGrid.innerHTML = entries.map((entry, index) => `
      <article class="timeline-item reveal-item"><div class="timeline-marker"><span>${pad(index + 1)}</span></div><div class="timeline-copy"><div class="card-readout"><span>${escapeHtml(entry.category || "Milestone")}</span><small>${escapeHtml(entry.subtitle || "Ongoing")}</small></div><h3>${escapeHtml(entry.title)}</h3><p>${escapeHtml(entry.description)}</p></div></article>`).join("");
  }

  function renderCertificates(certificates) {
    if (!certificates.length) {
      certificatesGrid.innerHTML = `<article class="certificate-card depth-card empty-state"><div class="card-readout"><span>Credential channel</span><small>AWAITING DATA</small></div><h3>Add your certificates from the admin page</h3><p>Training, awards, course completions, and recognitions will appear here.</p></article>`;
      return;
    }
    certificatesGrid.innerHTML = certificates.map((certificate, index) => `
      <article class="certificate-card depth-card reveal-item">${certificate.image_url ? `<img class="certificate-image" src="${escapeAttr(certificate.image_url)}" alt="${escapeAttr(certificate.title)} certificate" loading="lazy" />` : ""}<div class="card-readout"><span>${escapeHtml(certificate.category || "Certificate")}</span><small>CRT-${pad(index + 1)}</small></div><h3>${escapeHtml(certificate.title)}</h3><p>${escapeHtml(certificate.subtitle || certificate.description)}</p>${certificate.url ? `<a class="text-link" href="${escapeAttr(certificate.url)}" target="_blank" rel="noreferrer">View credential</a>` : ""}</article>`).join("");
  }

  function tags(values, className = "tag-list") {
    const clean = (values || []).filter(Boolean);
    return clean.length ? `<div class="${className}">${clean.map((value) => `<span>${escapeHtml(value)}</span>`).join("")}</div>` : "";
  }

  function updateCounts() {
    const values = { projects: byType("project").length, skills: byType("skill").length, certificates: byType("certificate").length };
    Object.entries(values).forEach(([key, value]) => { const node = document.querySelector(`[data-count-${key}]`); if (node) node.textContent = String(value); });
  }

  function pad(value) { return String(value).padStart(2, "0"); }
  function escapeHtml(value) { return String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
  function escapeAttr(value) { return escapeHtml(value).replaceAll("`", "&#096;"); }
})();
