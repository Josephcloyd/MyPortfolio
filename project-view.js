/* Renders a project case study from content.js (falling back to Supabase records for older project ids). */
(async function () {
  const root = document.querySelector("#main");
  if (!root) return;
  const content = window.PORTFOLIO_CONTENT || {};
  const icons = window.PortfolioIcons || { svg: () => "" };
  const store = window.PortfolioStore;
  const local = [...(content.projects || []), ...(content.moreProjects || [])];
  const id = resolveId();

  let project = local.find((entry) => entry.id === id);
  if (project) render(project);

  let remote = null;
  if (id && store?.hasSupabaseConfig()) {
    try { remote = await store.loadItem(id); } catch (error) { remote = null; }
  }
  if (remote && remote.type === "project") {
    if (!project) { project = fromRecord(remote); render(project); }
    else {
      const merged = { ...project };
      if (!merged.image && remote.image_url) merged.image = remote.image_url;
      if (!(merged.gallery || []).length && (remote.gallery_urls || []).length) merged.gallery = remote.gallery_urls;
      if (!merged.demo && remote.url) merged.demo = remote.url;
      render(merged);
    }
  }
  if (!project) renderMissing();

  // ?id= first; then a #project-id hash; then the last project clicked in this tab (site.js).
  function resolveId() {
    const query = new URLSearchParams(location.search).get("id");
    if (query) return query;
    const known = (value) => (value && local.some((entry) => entry.id === value) ? value : "");
    const fromHash = known(decodeURIComponent(location.hash.slice(1)));
    if (fromHash) return fromHash;
    let remembered = "";
    try { remembered = known(sessionStorage.getItem("portfolio-last-project")); } catch (error) { /* Storage unavailable. */ }
    return remembered;
  }

  function fromRecord(record) {
    return {
      id: record.id,
      title: record.title,
      tagline: record.subtitle,
      category: record.category,
      summary: record.description,
      tech: record.tags,
      role: record.role,
      problem: record.challenge,
      solution: record.solution,
      results: record.outcome,
      lessons: record.learnings,
      image: record.image_url,
      gallery: record.gallery_urls,
      demo: record.url
    };
  }

  function render(item) {
    document.title = `${item.title} — Joseph Clyde S. Daño`;
    document.querySelector('meta[name="description"]')?.setAttribute("content", item.summary || item.tagline || "");
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", `${item.title} — ${item.tagline || "Case study"}`);

    const shots = [item.image, ...(item.gallery || [])].filter(Boolean).filter((url, index, list) => list.indexOf(url) === index);
    const sections = [];
    const add = (title, body) => { if (body) sections.push({ title, body }); };

    add("Overview", item.overview || item.summary ? `<p class="lead">${escapeHtml(item.overview || item.summary)}</p>` : "");
    add("The problem", item.problem ? `<p>${escapeHtml(item.problem)}</p>` : "");
    add("How it was built", item.solution ? `<p>${escapeHtml(item.solution)}</p>` : "");
    add("My responsibilities", list(item.responsibilities));
    add("Technologies", (item.tech || []).length ? `<ul class="tech-tags tech-tags-lg">${item.tech.map((tech) => `<li>${escapeHtml(tech)}</li>`).join("")}</ul>` : "");
    add("Architecture", (item.architecture || []).length ? `<ol class="arch-flow">${item.architecture.map((node, index) => `<li><span class="arch-step">${pad(index + 1)}</span><strong>${escapeHtml(node.name)}</strong><span>${escapeHtml(node.detail)}</span></li>`).join("")}</ol>` : "");
    add("Key features", (item.features || []).length ? `<ul class="check-list check-list-cols">${item.features.map((feature) => `<li>${icons.svg("check")}${escapeHtml(feature)}</li>`).join("")}</ul>` : "");
    add("Screenshots", shots.length
      ? `<div class="gallery">${shots.map((url, index) => `<figure><img src="${escapeAttr(url)}" alt="${escapeAttr(`${item.title} screenshot ${index + 1}`)}" loading="lazy" decoding="async" width="1200" height="750" /></figure>`).join("")}</div>`
      : `<div class="gallery-empty">${icons.svg("image")}<span>Screenshots will be added soon.</span></div>`);
    add("Challenges & solutions", (item.challenges || []).length ? `<div class="challenges">${item.challenges.map((entry) => `<div class="challenge"><div><span class="mini-label">Challenge</span><p>${escapeHtml(entry.challenge)}</p></div><div><span class="mini-label">Solution</span><p>${escapeHtml(entry.solution)}</p></div></div>`).join("")}</div>` : "");
    add("Results & lessons", [item.results ? `<p>${escapeHtml(item.results)}</p>` : "", item.lessons ? `<p><span class="mini-label">Lessons learned</span><br>${escapeHtml(item.lessons)}</p>` : ""].join(""));

    const actions = [
      item.repo ? `<a class="btn btn-primary" href="${escapeAttr(item.repo)}" target="_blank" rel="noopener noreferrer">${icons.svg("github")}View repository</a>` : "",
      item.demo ? `<a class="btn ${item.repo ? "btn-ghost" : "btn-primary"}" href="${escapeAttr(item.demo)}" target="_blank" rel="noopener noreferrer">${icons.svg("arrow-up-right")}Live demo</a>` : ""
    ].join("");

    const all = local.length ? local : [item];
    const index = all.findIndex((entry) => entry.id === item.id);
    const next = index >= 0 && all.length > 1 ? all[(index + 1) % all.length] : null;

    root.innerHTML = `
      <section class="case-hero">
        <div class="container">
          <p class="project-kicker">${escapeHtml(item.category || "Project")}${item.status ? `<span class="badge">${escapeHtml(item.status)}</span>` : ""}</p>
          <h1>${escapeHtml(item.title)}</h1>
          ${item.tagline ? `<p class="case-tagline">${escapeHtml(item.tagline)}</p>` : ""}
          ${actions ? `<div class="hero-actions">${actions}</div>` : ""}
          <figure class="case-cover">${shots[0]
            ? cover(item, shots[0])
            : item.illustration
            ? `<div class="illus"><img src="${escapeAttr(item.illustration)}" alt="${escapeAttr(`Illustration of ${item.title}`)}" width="1600" height="1000" fetchpriority="high" /><span class="illus-label">Illustration</span></div>`
            : `<div class="placeholder placeholder-cover"><div class="ph-art" aria-hidden="true"><span class="ph-side"></span><span class="ph-lines"><i></i><i></i><i></i><i></i></span></div><span class="ph-label">${icons.svg("image")}Preview coming soon</span></div>`}</figure>
        </div>
      </section>
      <div class="container case-layout">
        <nav class="case-toc" aria-label="On this page">
          <p class="mini-label">On this page</p>
          <ol>${sections.map((section, i) => `<li><a href="#s-${i + 1}">${escapeHtml(section.title)}</a></li>`).join("")}</ol>
        </nav>
        <div class="case-body">
          ${sections.map((section, i) => `<section class="case-section" id="s-${i + 1}" aria-labelledby="s-${i + 1}-h"><h2 id="s-${i + 1}-h"><span>${pad(i + 1)}</span>${escapeHtml(section.title)}</h2>${section.body}</section>`).join("")}
          <section class="case-section case-links" aria-label="Project links">
            ${actions ? `<div class="hero-actions">${actions}</div>` : `<p class="muted">Repository and demo links will be published here when available.</p>`}
          </section>
        </div>
      </div>
      <div class="container case-footer-nav">
        <a class="text-link" href="index.html#projects">${icons.svg("arrow-left")}All projects</a>
        ${next ? `<a class="next-project" href="project.html?id=${encodeURIComponent(next.id)}"><span class="mini-label">Next project</span><strong>${escapeHtml(next.title)} ${icons.svg("arrow-right")}</strong></a>` : ""}
      </div>`;
  }

  // Web projects get a browser frame around the screenshot; hardware photos are shown as-is.
  function cover(item, url) {
    const img = `<img src="${escapeAttr(url)}" alt="${escapeAttr(`${item.title} preview`)}" width="1600" height="865" fetchpriority="high" />`;
    const groups = item.groups || [];
    if (groups.includes("embedded") || groups.includes("logic")) return img;
    let label = item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    try { if (item.demo) label = new URL(item.demo).hostname.replace(/^www\./, ""); } catch (error) { /* Keep the title label. */ }
    return `<div class="shot"><div class="ph-chrome"><i></i><i></i><i></i><span>${escapeHtml(label)}</span></div>${img}</div>`;
  }

  function list(values) { return (values || []).length ? `<ul class="bullet-list">${values.map((value) => `<li>${escapeHtml(value)}</li>`).join("")}</ul>` : ""; }

  // Without an id (e.g. project.html opened directly) show every project instead of a dead end;
  // with an unknown id, say so and still offer the full list.
  function renderMissing() {
    const known = Boolean(id);
    document.title = `${known ? "Project not found" : "Projects"} — Joseph Clyde S. Daño`;
    const rows = local.map((entry) => `
      <li class="build-row"><a href="project.html?id=${encodeURIComponent(entry.id)}">
        <span class="build-title">${escapeHtml(entry.title)}<small>${escapeHtml(entry.tagline || entry.category)}</small></span>
        <span class="build-tech">${escapeHtml(entry.status || entry.category || "")}</span>
        ${icons.svg("arrow-up-right")}
      </a></li>`).join("");
    root.innerHTML = `<section class="container missing">
      <p class="section-index">${known ? "404" : "Case studies"}</p>
      <h1>${known ? "Project not found." : "All projects."}</h1>
      <p class="muted">${known ? "This project may have been renamed or is no longer listed. Choose one below." : "Choose a project to read its case study."}</p>
      ${rows ? `<ul class="build-list missing-list">${rows}</ul>` : ""}
      <a class="btn btn-ghost" href="index.html#projects">${icons.svg("arrow-left")}Back to portfolio</a>
    </section>`;
  }

  function pad(value) { return String(value).padStart(2, "0"); }
  function escapeHtml(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
  function escapeAttr(value) { return escapeHtml(value).replaceAll("`", "&#096;"); }
})();
