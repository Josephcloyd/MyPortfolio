(async function () {
  const store = window.PortfolioStore;
  const skillsGrid = document.querySelector("#skillsGrid");
  const projectsGrid = document.querySelector("#projectsGrid");
  const certificatesGrid = document.querySelector("#certificatesGrid");
  const timelineGrid = document.querySelector("#timelineGrid");
  const filters = document.querySelector("#projectFilters");
  if (!store || !skillsGrid || !projectsGrid || !certificatesGrid) return;

  const items = await store.loadItems();
  const byType = (type) => items.filter((item) => item.type === type);
  const projects = byType("project");
  renderSkills(byType("skill"));
  renderProjects(projects);
  renderCertificates(byType("certificate"));
  renderTimeline(byType("experience"));
  renderFilters(projects);
  updateCounts();
  document.dispatchEvent(new CustomEvent("portfolio:rendered"));

  function renderSkills(skills) {
    skillsGrid.innerHTML = skills.map((skill, index) => `
      <article class="card depth-card reveal-item">
        <div class="card-readout"><span class="card-kicker">${escapeHtml(skill.category || "Skill")}</span><small>CAP-${pad(index + 1)}</small></div>
        <h3>${escapeHtml(skill.title)}</h3><p>${escapeHtml(skill.description)}</p>${tags(skill.tags)}
      </article>`).join("");
  }

  function renderProjects(collection) {
    projectsGrid.innerHTML = collection.map((project, index) => `
      <article class="project-card depth-card reveal-item ${project.featured ? "featured" : ""}" data-category="${escapeAttr(project.category.toLowerCase())}">
        ${project.image_url ? `<a class="project-media" href="project.html?id=${encodeURIComponent(project.id)}"><img src="${escapeAttr(project.image_url)}" alt="Preview of ${escapeAttr(project.title)}" loading="lazy" /></a>` : `<a class="project-media project-media-fallback" href="project.html?id=${encodeURIComponent(project.id)}" aria-label="Open ${escapeAttr(project.title)} case study"><span>${escapeHtml(project.category || "System")}</span><i></i><i></i><i></i></a>`}
        <div class="card-readout"><span>${project.featured ? "Priority system" : "System node"}</span><small>PRJ-${pad(index + 1)}</small></div>
        ${tags([project.category, project.subtitle].filter(Boolean), "project-meta")}
        <h3>${escapeHtml(project.title)}</h3><p>${escapeHtml(project.description)}</p>
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
      projectsGrid.querySelectorAll(".project-card").forEach((card) => {
        card.hidden = button.dataset.filter !== "all" && card.dataset.category !== button.dataset.filter;
      });
    });
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
