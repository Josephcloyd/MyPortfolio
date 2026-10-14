/* Renders the home page from content.js, then overlays media, links, and certificates from Supabase. */
(function () {
  const content = window.PORTFOLIO_CONTENT;
  if (!content) return;
  const icons = window.PortfolioIcons || { svg: () => "", brand: () => "" };
  const $ = (selector) => document.querySelector(selector);
  const profile = content.profile || {};
  const contact = content.contact || {};

  let projects = (content.projects || []).map((project) => ({ ...project }));
  let moreProjects = (content.moreProjects || []).map((project) => ({ ...project }));
  let activeFilter = "all";

  renderHero();
  renderEditor("profile");
  renderAbout();
  renderTimeline();
  renderProjects();
  renderFilters();
  renderStack();
  renderContact();
  wireEditorTabs();
  document.dispatchEvent(new CustomEvent("portfolio:rendered"));
  restoreHash();
  loadRemote();

  // Sections are rendered after the browser's initial anchor jump, so re-apply it once layout is final.
  function restoreHash() {
    if (!location.hash || location.hash === "#home") return;
    let target = null;
    try { target = document.querySelector(location.hash); } catch (error) { return; }
    if (target) requestAnimationFrame(() => target.scrollIntoView({ block: "start", behavior: "instant" }));
  }

  /* Hero */
  function renderHero() {
    document.querySelectorAll("[data-bind]").forEach((node) => {
      const [group, key] = node.dataset.bind.split(".");
      const value = (content[group] || {})[key];
      if (value) node.textContent = value;
    });
    const headline = $("[data-hero-headline]");
    if (headline && profile.headline) headline.innerHTML = profile.headline.map(escapeHtml).join(' <span aria-hidden="true">•</span> ');
    const intro = $("[data-hero-intro]");
    if (intro && profile.intro) {
      let html = escapeHtml(profile.intro);
      (profile.introHighlights || []).forEach((phrase) => { html = html.replace(escapeHtml(phrase), `<em>${escapeHtml(phrase)}</em>`); });
      intro.innerHTML = html;
    }
    const tags = $("[data-hero-tags]");
    if (tags) tags.innerHTML = (profile.heroTags || []).map((tag) => `<li>${escapeHtml(tag)}</li>`).join("");
    document.querySelectorAll("[data-profile-photo]").forEach((node) => {
      const avatar = profile.avatar || profile.photo;
      if (avatar) node.innerHTML = `<img src="${escapeAttr(avatar)}" alt="" width="40" height="40" decoding="async" />`;
      else node.textContent = profile.monogram || "JD";
    });
  }

  /* Code editor */
  function renderEditor(file) {
    const code = $("[data-editor-code]");
    if (!code) return;
    const lines = file === "contact" ? contactLines() : profileLines();
    code.innerHTML = lines.map((line) => `<span class="line">${line || " "}</span>`).join("");
    const lang = $("[data-editor-lang]");
    if (lang) lang.textContent = file === "contact" ? "JSON" : "TypeScript";
  }

  function profileLines() {
    const pick = (id, count) => ((content.techStack || []).find((group) => group.id === id)?.items || []).map((item) => item.name).filter((name) => name.length <= 12).slice(0, count);
    const list = (values) => `[${values.map(str).join(p(", "))}]`;
    const prop = (key, value, indent = 2) => `${" ".repeat(indent)}${t("prop", key)}${p(":")} ${value}${p(",")}`;
    return [
      t("comment", "// Hi, I build practical software."),
      `${t("kw", "export const")} ${t("var", "developer")} ${p("=")} ${p("{")}`,
      prop("name", str(profile.name)),
      prop("role", str(profile.editorRole || (profile.headline || [])[0] || "Developer")),
      prop("location", str(contact.location || "")),
      `  ${t("prop", "stack")}${p(":")} ${p("{")}`,
      prop("web", list([...pick("frontend", 2), "TypeScript"]), 4),
      prop("backend", list(pick("backend", 3)), 4),
      prop("data", list(pick("databases", 2)), 4),
      prop("hardware", list(pick("hardware", 3)), 4),
      `  ${p("},")}`,
      prop("available", t("kw", "true")),
      `${p("};")}`
    ];
  }

  function contactLines() {
    const entries = [["email", contact.email], ["phone", contact.phone], ["location", contact.location], ["github", stripProtocol(content.socials?.github)], ["linkedin", stripProtocol(content.socials?.linkedin)]].filter(([, value]) => value);
    return [p("{"), ...entries.map(([key, value], index) => `  ${t("prop", `"${key}"`)}${p(":")} ${str(value)}${index < entries.length - 1 ? p(",") : ""}`), p("}")];
  }

  function wireEditorTabs() {
    const tabs = [...document.querySelectorAll("[data-editor-tab]")];
    const select = (tab) => {
      tabs.forEach((entry) => {
        const active = entry === tab;
        entry.classList.toggle("is-active", active);
        entry.setAttribute("aria-selected", String(active));
        entry.tabIndex = active ? 0 : -1;
      });
      renderEditor(tab.dataset.editorTab);
    };
    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => select(tab));
      tab.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
        const next = tabs[(index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
        next.focus();
        select(next);
      });
    });
  }

  /* About */
  function renderAbout() {
    const about = content.about || {};
    const copy = $("[data-about-copy]");
    if (copy) copy.innerHTML = (about.paragraphs || []).map((text, index) => `<p${index === 0 ? ' class="lead"' : ""}>${escapeHtml(text)}</p>`).join("");
    const facts = $("[data-about-facts]");
    if (facts) facts.innerHTML = (about.facts || []).map((fact) => `<div><dt>${escapeHtml(fact.label)}</dt><dd>${escapeHtml(fact.value)}</dd></div>`).join("");
    const portrait = $("[data-portrait]");
    if (portrait && profile.photo) { portrait.classList.add("has-photo"); portrait.innerHTML = `<img src="${escapeAttr(profile.photo)}" alt="${escapeAttr(profile.photoAlt || profile.name)}" width="800" height="1000" loading="lazy" decoding="async" />`; }
  }

  /* Experience */
  function renderTimeline() {
    const root = $("[data-timeline]");
    if (!root) return;
    const wide = matchMedia("(min-width: 760px)");
    root.innerHTML = (content.experience || []).map((job, index) => {
      const related = job.relatedProject && projects.find((project) => project.id === job.relatedProject);
      const duties = (job.responsibilities || []).length
        ? `<details class="duties"${index === 0 || wide.matches ? " open" : ""}><summary>Responsibilities ${icons.svg("chevron-down")}</summary><ul>${job.responsibilities.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></details>`
        : "";
      return `<li class="timeline-item reveal">
        <div class="timeline-when"><time>${escapeHtml(job.period)}</time>${job.type ? `<span class="badge">${escapeHtml(job.type)}</span>` : ""}</div>
        <div class="timeline-body">
          <h3>${escapeHtml(job.company)}</h3>
          ${job.role ? `<p class="timeline-role">${escapeHtml(job.role)}</p>` : ""}
          ${duties}
          ${related ? `<a class="text-link" href="${projectHref(related)}">Related project: ${escapeHtml(related.title)} ${icons.svg("arrow-right")}</a>` : ""}
        </div>
      </li>`;
    }).join("");
    // The toggle is hidden on wide screens, so keep every list expanded there.
    wide.addEventListener("change", (event) => { if (event.matches) root.querySelectorAll("details.duties").forEach((node) => { node.open = true; }); });
  }

  /* Projects */
  function renderProjects() {
    const featured = projects.filter((project) => project.featured);
    const regular = projects.filter((project) => !project.featured);
    const featuredRoot = $("[data-featured-projects]");
    const gridRoot = $("[data-projects]");
    const moreRoot = $("[data-more-projects]");

    if (featuredRoot) featuredRoot.innerHTML = featured.map((project, index) => `
      <article class="featured reveal${index % 2 ? " is-reversed" : ""}" data-groups="${escapeAttr((project.groups || []).join(" "))}" aria-labelledby="${escapeAttr(project.id)}-title">
        <a class="featured-media" href="${projectHref(project)}" tabindex="-1" aria-hidden="true">${media(project, "large")}</a>
        <div class="featured-copy">
          <p class="project-kicker"><span class="project-num">${pad(index + 1)}</span>${escapeHtml(project.category)}${statusBadge(project)}</p>
          <h3 id="${escapeAttr(project.id)}-title"><a href="${projectHref(project)}">${escapeHtml(project.title)}</a></h3>
          <p class="project-tagline">${escapeHtml(project.tagline)}</p>
          <p>${escapeHtml(project.summary)}</p>
          ${(project.highlights || []).length ? `<ul class="check-list">${project.highlights.map((item) => `<li>${icons.svg("check")}${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
          ${techList(project.tech)}
          <div class="project-actions">
            <a class="btn btn-ghost btn-sm" href="${projectHref(project)}">Case study ${icons.svg("arrow-right")}</a>
            ${externalActions(project)}
          </div>
        </div>
      </article>`).join("");

    if (gridRoot) gridRoot.innerHTML = regular.map((project, index) => `
      <article class="project-card reveal" data-groups="${escapeAttr((project.groups || []).join(" "))}">
        <div class="card-media">${media(project, "small")}</div>
        <div class="card-body">
          <p class="project-kicker"><span class="project-num">${pad(featured.length + index + 1)}</span>${escapeHtml(project.category)}${statusBadge(project)}</p>
          <h3><a class="stretched-link" href="${projectHref(project)}">${escapeHtml(project.title)}</a></h3>
          <p class="project-tagline">${escapeHtml(project.tagline)}</p>
          <p class="card-summary">${escapeHtml(project.summary)}</p>
          ${techList(project.tech)}
          <span class="card-cta" aria-hidden="true">View case study ${icons.svg("arrow-up-right")}</span>
        </div>
      </article>`).join("");

    if (moreRoot) moreRoot.innerHTML = moreProjects.map((project) => `
      <li class="build-row reveal" data-groups="${escapeAttr((project.groups || []).join(" "))}">
        <a href="${projectHref(project)}">
          <span class="build-title">${escapeHtml(project.title)}<small>${escapeHtml(project.tagline || project.category)}</small></span>
          <span class="build-tech">${(project.tech || []).slice(0, 3).map(escapeHtml).join(" · ")}</span>
          ${icons.svg("arrow-up-right")}
        </a>
      </li>`).join("");

    applyFilter();
  }

  function renderFilters() {
    const root = $("[data-project-filters]");
    if (!root) return;
    const all = [...projects, ...moreProjects];
    const filters = (content.projectFilters || []).filter((filter) => filter.id === "all" || all.some((project) => (project.groups || []).includes(filter.id)));
    root.innerHTML = filters.map((filter) => `<button class="filter-btn${filter.id === activeFilter ? " is-active" : ""}" type="button" aria-pressed="${filter.id === activeFilter}" data-filter="${escapeAttr(filter.id)}">${escapeHtml(filter.label)}</button>`).join("");
    root.addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter]");
      if (!button) return;
      activeFilter = button.dataset.filter;
      root.querySelectorAll("[data-filter]").forEach((entry) => {
        const active = entry === button;
        entry.classList.toggle("is-active", active);
        entry.setAttribute("aria-pressed", String(active));
      });
      applyFilter();
    });
  }

  function applyFilter() {
    let visible = 0;
    document.querySelectorAll("#projects [data-groups]").forEach((node) => {
      const show = activeFilter === "all" || node.dataset.groups.split(" ").includes(activeFilter);
      node.hidden = !show;
      if (show) { visible += 1; node.classList.add("is-visible"); }
    });
    const moreWrap = $("[data-more-wrap]");
    if (moreWrap) moreWrap.hidden = ![...moreWrap.querySelectorAll("[data-groups]")].some((node) => !node.hidden);
    const empty = $("[data-empty-filter]");
    if (empty) empty.hidden = visible > 0;
  }

  function media(project, size) {
    const image = project.image || (project.gallery || [])[0];
    const groups = project.groups || [];
    const kind = groups.includes("logic") ? "logic" : groups.includes("embedded") ? "board" : "browser";
    const chrome = `<div class="ph-chrome"><i></i><i></i><i></i><span>${escapeHtml(frameLabel(project))}</span></div>`;
    if (image) {
      const img = `<img src="${escapeAttr(image)}" alt="${escapeAttr(`${project.title} — ${project.tagline || "screenshot"}`)}" loading="lazy" decoding="async" width="1600" height="865" />`;
      return kind === "browser" ? `<div class="shot">${chrome}${img}</div>` : img;
    }
    if (project.illustration) return illustration(project);
    return `<div class="placeholder placeholder-${kind} placeholder-${size}">
      ${kind === "browser" ? chrome : ""}
      <div class="ph-art" aria-hidden="true">${placeholderArt(kind)}</div>
      <span class="ph-label">${icons.svg("image")}Screenshots coming soon</span>
    </div>`;
  }

  function placeholderArt(kind) {
    if (kind === "board") return `<span class="chip"><b>MCU</b></span><span class="trace t1"></span><span class="trace t2"></span><span class="trace t3"></span>`;
    if (kind === "logic") return `<span class="bits">A 1011<br>B 0110<br><b>= 10001</b></span>`;
    return `<span class="ph-side"></span><span class="ph-lines"><i></i><i></i><i></i><i></i></span>`;
  }

  // Concept artwork, clearly labelled so it is never mistaken for a real screenshot.
  function illustration(project) {
    return `<div class="illus"><img src="${escapeAttr(project.illustration)}" alt="${escapeAttr(`Illustration of ${project.title}`)}" loading="lazy" decoding="async" width="1600" height="1000" /><span class="illus-label">Illustration</span></div>`;
  }

  function frameLabel(project) {
    try { if (project.demo) return new URL(project.demo).hostname.replace(/^www\./, ""); } catch (error) { /* Fall back to the title. */ }
    return project.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  }

  function statusBadge(project) { return project.status ? `<span class="badge">${escapeHtml(project.status)}</span>` : ""; }
  function techList(tech) { return (tech || []).length ? `<ul class="tech-tags" aria-label="Technologies">${tech.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""; }
  function externalActions(project) {
    return [
      project.repo ? `<a class="btn btn-ghost btn-sm" href="${escapeAttr(project.repo)}" target="_blank" rel="noopener noreferrer">${icons.svg("github")}Code</a>` : "",
      project.demo ? `<a class="btn btn-ghost btn-sm" href="${escapeAttr(project.demo)}" target="_blank" rel="noopener noreferrer">${icons.svg("arrow-up-right")}Live demo</a>` : ""
    ].join("");
  }

  /* Tech stack */
  function renderStack() {
    const tabs = $("[data-stack-tabs]");
    const panels = $("[data-stack-panels]");
    if (!tabs || !panels) return;
    const groups = content.techStack || [];
    tabs.innerHTML = [{ id: "all", label: "All" }, ...groups].map((group, index) => `<button class="filter-btn${index === 0 ? " is-active" : ""}" type="button" aria-pressed="${index === 0}" data-stack="${escapeAttr(group.id)}">${escapeHtml(group.label)}</button>`).join("");
    panels.innerHTML = groups.map((group) => `
      <section class="stack-group reveal" data-stack-group="${escapeAttr(group.id)}" aria-label="${escapeAttr(group.label)}">
        <h3>${escapeHtml(group.label)}</h3>
        <ul class="tech-grid">${group.items.map((item) => `
          <li class="tech-tile" tabindex="0" data-tooltip="${escapeAttr(item.name)}">
            <span class="tech-icon">${item.icon ? icons.brand(item.icon) : `<span class="tech-mono">${escapeHtml(item.mono || item.name.slice(0, 2))}</span>`}</span>
            <span class="tech-name">${escapeHtml(item.name)}</span>
          </li>`).join("")}
        </ul>
      </section>`).join("");
    tabs.addEventListener("click", (event) => {
      const button = event.target.closest("[data-stack]");
      if (!button) return;
      tabs.querySelectorAll("[data-stack]").forEach((entry) => {
        const active = entry === button;
        entry.classList.toggle("is-active", active);
        entry.setAttribute("aria-pressed", String(active));
      });
      panels.querySelectorAll("[data-stack-group]").forEach((group) => {
        group.hidden = button.dataset.stack !== "all" && group.dataset.stackGroup !== button.dataset.stack;
        group.classList.add("is-visible");
      });
    });
  }

  /* Contact */
  function renderContact() {
    const list = $("[data-contact-list]");
    if (!list) return;
    const rows = [];
    if (contact.email) rows.push(`<li><span class="contact-icon">${icons.svg("mail")}</span><div><span class="contact-label">Email</span><a href="mailto:${escapeAttr(contact.email)}">${escapeHtml(contact.email)}</a></div><button class="copy-btn" type="button" data-copy="${escapeAttr(contact.email)}" aria-label="Copy email address">${icons.svg("copy")}<span>Copy</span></button></li>`);
    if (contact.phone) rows.push(`<li><span class="contact-icon">${icons.svg("phone")}</span><div><span class="contact-label">Mobile</span><a href="tel:${escapeAttr(contact.phone)}">${escapeHtml(contact.phoneDisplay || contact.phone)}</a></div></li>`);
    if (contact.location) rows.push(`<li><span class="contact-icon">${icons.svg("map-pin")}</span><div><span class="contact-label">Location</span><span>${escapeHtml(contact.location)}</span></div></li>`);
    list.innerHTML = rows.join("");
  }

  /* Supabase overlay: uploaded media, live URLs, certificates. */
  async function loadRemote() {
    const store = window.PortfolioStore;
    if (!store || !store.hasSupabaseConfig()) return;
    let items;
    try { items = await store.loadItems(); } catch (error) { return; }
    const byId = new Map(items.map((item) => [item.id, item]));
    let changed = false;
    const merge = (project) => {
      const remote = byId.get(project.id);
      if (!remote) return project;
      const next = { ...project };
      if (!next.image && remote.image_url) { next.image = remote.image_url; changed = true; }
      if (!(next.gallery || []).length && (remote.gallery_urls || []).length) { next.gallery = remote.gallery_urls; changed = true; }
      if (!next.demo && remote.url) { next.demo = remote.url; changed = true; }
      return next;
    };
    projects = projects.map(merge);
    moreProjects = moreProjects.map(merge);
    if (changed) { renderProjects(); document.dispatchEvent(new CustomEvent("portfolio:rendered")); }
    renderCertificates(items.filter((item) => item.type === "certificate"));
  }

  function renderCertificates(certificates) {
    const root = $("[data-certificates]");
    if (!root || !certificates.length) return;
    root.innerHTML = `<h3 class="subhead">Certifications &amp; training</h3><ul class="build-list">${certificates.map((cert) => `
      <li class="build-row">${cert.url ? `<a href="${escapeAttr(cert.url)}" target="_blank" rel="noopener noreferrer">` : "<div>"}
        <span class="build-title">${escapeHtml(cert.title)}<small>${escapeHtml(cert.subtitle || cert.category)}</small></span>
        ${cert.url ? `${icons.svg("arrow-up-right")}</a>` : "</div>"}
      </li>`).join("")}</ul>`;
    root.hidden = false;
  }

  /* Helpers */
  function projectHref(project) { return `project.html?id=${encodeURIComponent(project.id)}`; }
  function t(kind, value) { return `<span class="tok-${kind}">${escapeHtml(value)}</span>`; }
  function p(value) { return t("punc", value); }
  function str(value) { return t("str", `"${value}"`); }
  function stripProtocol(url) { return url ? String(url).replace(/^https?:\/\//, "").replace(/\/$/, "") : ""; }
  function pad(value) { return String(value).padStart(2, "0"); }
  function escapeHtml(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
  function escapeAttr(value) { return escapeHtml(value).replaceAll("`", "&#096;"); }
})();
