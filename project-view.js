(async function () {
  const root = document.querySelector("#caseStudy");
  const id = new URLSearchParams(location.search).get("id");
  if (!root || !window.PortfolioStore || !id) { renderMissing(); return; }
  const project = await window.PortfolioStore.loadItem(id);
  if (!project || project.type !== "project") { renderMissing(); return; }
  document.title = `${project.title} | Joseph Clyde Daño`;
  const gallery = [project.image_url, ...(project.gallery_urls || [])].filter(Boolean);
  root.innerHTML = `
    <section class="case-hero">
      <div><div class="hero-route"><span>Project Network</span><span>${escapeHtml(project.category || "Case Study")}</span></div><p class="eyebrow">System Record / ${project.featured ? "Priority" : "Active"}</p><h1>${escapeHtml(project.title)}</h1><p class="hero-text">${escapeHtml(project.description)}</p><div class="case-actions"><a class="btn btn-primary" href="index.html#projects">Back to Projects</a>${project.url ? `<a class="btn btn-outline" href="${escapeAttr(project.url)}" target="_blank" rel="noreferrer">Open Live Project</a>` : ""}</div></div>
      ${gallery[0] ? `<figure class="case-media"><img src="${escapeAttr(gallery[0])}" alt="${escapeAttr(project.title)} project preview" /></figure>` : `<div class="case-media project-media-fallback"><span>${escapeHtml(project.category || "System")}</span><i></i><i></i><i></i></div>`}
    </section>
    <section class="case-metrics"><div><span>Type</span><strong>${escapeHtml(project.category || "Project")}</strong></div><div><span>Mode</span><strong>${escapeHtml(project.subtitle || "Development")}</strong></div><div><span>Role</span><strong>${escapeHtml(project.role || "Builder")}</strong></div></section>
    <section class="case-overview depth-card">
      <div><p class="eyebrow">Overview</p><h2>What this build demonstrates</h2><p>${escapeHtml(project.stack_summary || "A practical system shaped around a real workflow, with attention to data, interface, and implementation details.")}</p></div>
      <div class="case-snapshot"><span>Status</span><strong>${project.published ? "Published" : "Draft"}</strong><span>Media</span><strong>${gallery.length ? `${gallery.length} available` : "Ready for screenshots"}</strong></div>
    </section>
    <section class="case-gallery" aria-label="Project screenshots">
      ${gallery.length ? gallery.map((url, index) => `<figure><img src="${escapeAttr(url)}" alt="${escapeAttr(project.title)} screenshot ${index + 1}" loading="lazy" /><figcaption>Preview ${String(index + 1).padStart(2, "0")}</figcaption></figure>`).join("") : Array.from({ length: 3 }, (_, index) => `<div class="gallery-placeholder"><span>Image slot ${String(index + 1).padStart(2, "0")}</span><small>Add screenshots from admin</small></div>`).join("")}
    </section>
    <section class="case-grid">
      ${casePanel("01", "Challenge", project.challenge || "The project began with a practical workflow that needed a clearer, more reliable system.")}
      ${casePanel("02", "Approach", project.solution || project.description)}
      ${casePanel("03", "Outcome", project.outcome || "The result is a working foundation that can be tested, improved, and extended with real users.")}
    </section>
    <section class="case-grid case-grid-secondary">
      ${casePanel("04", "What I learned", project.learnings || "Each build sharpened the way I connect requirements, interface decisions, and implementation tradeoffs.")}
      ${casePanel("05", "Future improvements", project.next_steps || "The next iteration can add stronger validation, richer media, better testing, and more real-user feedback.")}
      ${casePanel("06", "Stack summary", project.stack_summary || (project.tags || []).join(", ") || "Project-specific tools and workflow design.")}
    </section>
    <section class="case-stack"><p class="eyebrow">Technology Stack</p><div class="tag-list">${(project.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div></section>`;

  function casePanel(index, title, copy) { return `<article class="case-panel"><div class="card-readout"><span>${title}</span><small>LOG-${index}</small></div><p>${escapeHtml(copy)}</p></article>`; }
  function renderMissing() { if (root) root.innerHTML = `<section class="missing-state"><p class="eyebrow">Record unavailable</p><h1>Project not found.</h1><p>The requested project may be unpublished or no longer available.</p><a class="btn btn-primary" href="index.html#projects">View Projects</a></section>`; }
  function escapeHtml(value) { return String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
  function escapeAttr(value) { return escapeHtml(value).replaceAll("`", "&#096;"); }
})();
