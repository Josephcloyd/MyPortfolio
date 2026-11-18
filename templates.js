/* HTML templates for the home page sections, shared by the browser and the build.
 *
 * home.js uses these to render (and re-render) sections; scripts/build.mjs runs the same functions
 * in Node to pre-render them into dist/index.html, so crawlers and AI bots that don't execute
 * JavaScript still see the full About, Experience, Projects, Tech Stack, FAQ, and Contact content.
 * Every function is pure: content in, HTML string out. Icons come from window.PortfolioIcons.
 */
(function () {
  const icons = () => window.PortfolioIcons || { svg: () => "", brand: () => "" };

  function escapeHtml(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
  function escapeAttr(value) { return escapeHtml(value).replaceAll("`", "&#096;"); }
  function pad(value) { return String(value).padStart(2, "0"); }
  function projectHref(project) { return `project.html?id=${encodeURIComponent(project.id)}`; }

  /* Hero ------------------------------------------------------------------- */
  function heroTags(profile) {
    return (profile.heroTags || []).map((tag) => `<li>${escapeHtml(tag)}</li>`).join("");
  }

  // GitHub / LinkedIn / Facebook carry rel="me" so search engines can tie the profiles to this site.
  function socialLinks(content, config = {}) {
    const socials = content.socials || {};
    const email = (content.contact || {}).email || config.contactEmail;
    const https = (url) => (/^https:\/\/[^\s]+$/.test(url || "") ? url : "");
    const entries = [
      ["GitHub", "github", https(socials.github || config.githubUrl)],
      ["LinkedIn", "linkedin", https(socials.linkedin || config.linkedinUrl)],
      ["Facebook", "facebook", https(socials.facebook)]
    ].filter(([, , href]) => href).map(([label, icon, href]) => ({ label, icon, href, external: true }));
    if (email) entries.push({ label: `Email ${email}`, icon: "mail", href: `mailto:${email}`, external: false });
    return entries.map((entry) => `<li><a class="icon-btn" href="${escapeAttr(entry.href)}" aria-label="${escapeAttr(entry.label)}" title="${escapeAttr(entry.label)}"${entry.external ? ' target="_blank" rel="me noopener noreferrer"' : ""}>${icons().svg(entry.icon) || escapeHtml(entry.label)}</a></li>`).join("");
  }

  /* About ------------------------------------------------------------------ */
  function aboutCopy(about) {
    return ((about || {}).paragraphs || []).map((text, index) => `<p${index === 0 ? ' class="lead"' : ""}>${escapeHtml(text)}</p>`).join("");
  }

  /* Experience ------------------------------------------------------------- */
  // expandAll: true pre-renders every responsibility list open (no JavaScript needed to read them).
  function timeline(experience, projects, { expandAll = false } = {}) {
    return (experience || []).map((job, index) => {
      const related = job.relatedProject && (projects || []).find((project) => project.id === job.relatedProject);
      const duties = (job.responsibilities || []).length
        ? `<details class="duties"${index === 0 || expandAll ? " open" : ""}><summary>Responsibilities ${icons().svg("chevron-down")}</summary><ul>${job.responsibilities.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></details>`
        : "";
      return `<li class="timeline-item reveal">
        <div class="timeline-when"><time>${escapeHtml(job.period)}</time>${job.type ? `<span class="badge">${escapeHtml(job.type)}</span>` : ""}</div>
        <div class="timeline-body">
          <h3>${escapeHtml(job.company)}</h3>
          ${job.role ? `<p class="timeline-role">${escapeHtml(job.role)}</p>` : ""}
          ${duties}
          ${related ? `<a class="text-link" href="${projectHref(related)}">Related project: ${escapeHtml(related.title)} ${icons().svg("arrow-right")}</a>` : ""}
        </div>
      </li>`;
    }).join("");
  }

  /* Projects --------------------------------------------------------------- */
  function projectSlides(projects) {
    return (projects || []).map((project, index) => `
      <article class="slide" data-slide data-groups="${escapeAttr((project.groups || []).join(" "))}" aria-roledescription="slide" aria-labelledby="${escapeAttr(project.id)}-title">
        <div class="slide-card">
          <a class="slide-media" href="${projectHref(project)}" tabindex="-1" aria-hidden="true">${media(project, "large")}</a>
          <div class="slide-body">
            <p class="project-kicker"><span class="project-num">${pad(index + 1)}</span>${escapeHtml(project.category)}${statusBadge(project)}</p>
            <h3 id="${escapeAttr(project.id)}-title"><a href="${projectHref(project)}">${escapeHtml(project.title)}</a></h3>
            <p class="project-tagline">${escapeHtml(project.tagline)}</p>
            <p class="slide-summary">${escapeHtml(project.summary)}</p>
            ${techList((project.tech || []).slice(0, 5))}${(project.tech || []).length > 5 ? `<span class="visually-hidden">Also uses: ${project.tech.slice(5).map(escapeHtml).join(", ")}.</span>` : ""}
            <div class="project-actions">
              <a class="btn btn-primary btn-sm" href="${projectHref(project)}">Case study ${icons().svg("arrow-right")}</a>
              ${externalActions(project)}
            </div>
          </div>
        </div>
      </article>`).join("");
  }

  // The visible row stays compact; a visually hidden summary keeps the 1–2 sentence description in the HTML.
  function moreProjects(projects) {
    return (projects || []).map((project) => `
      <li class="build-row reveal" data-groups="${escapeAttr((project.groups || []).join(" "))}">
        <a href="${projectHref(project)}">
          <span class="build-title">${escapeHtml(project.title)}<small>${escapeHtml(project.tagline || project.category)}</small></span>
          <span class="build-tech">${(project.tech || []).slice(0, 3).map(escapeHtml).join(" · ")}</span>
          ${icons().svg("arrow-up-right")}
          <span class="visually-hidden">${escapeHtml(project.summary)} Technologies: ${(project.tech || []).map(escapeHtml).join(", ")}.</span>
        </a>
      </li>`).join("");
  }

  function projectFilters(filters, allProjects, activeFilter = "all") {
    return (filters || [])
      .filter((filter) => filter.id === "all" || (allProjects || []).some((project) => (project.groups || []).includes(filter.id)))
      .map((filter) => `<button class="filter-btn${filter.id === activeFilter ? " is-active" : ""}" type="button" aria-pressed="${filter.id === activeFilter}" data-filter="${escapeAttr(filter.id)}">${escapeHtml(filter.label)}</button>`).join("");
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
      <span class="ph-label">${icons().svg("image")}Screenshots coming soon</span>
    </div>`;
  }

  function placeholderArt(kind) {
    if (kind === "board") return `<span class="chip"><b>MCU</b></span><span class="trace t1"></span><span class="trace t2"></span><span class="trace t3"></span>`;
    if (kind === "logic") return `<span class="bits">A 1011<br>B 0110<br><b>= 10001</b></span>`;
    return `<span class="ph-side"></span><span class="ph-lines"><i></i><i></i><i></i><i></i></span>`;
  }

  // Concept artwork, clearly labelled so it is never mistaken for a real screenshot.
  function illustration(project) {
    return `<div class="illus"><img src="${escapeAttr(project.illustration)}" alt="${escapeAttr(`Illustration of ${project.title} — ${project.tagline || project.category}`)}" loading="lazy" decoding="async" width="1600" height="1000" /><span class="illus-label">Illustration</span></div>`;
  }

  function frameLabel(project) {
    try { if (project.demo) return new URL(project.demo).hostname.replace(/^www\./, ""); } catch (error) { /* Fall back to the title. */ }
    return project.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  }

  function statusBadge(project) { return project.status ? `<span class="badge">${escapeHtml(project.status)}</span>` : ""; }
  function techList(tech) { return (tech || []).length ? `<ul class="tech-tags" aria-label="Technologies">${tech.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""; }
  function externalActions(project) {
    return [
      project.repo ? `<a class="btn btn-ghost btn-sm" href="${escapeAttr(project.repo)}" target="_blank" rel="noopener noreferrer">${icons().svg("github")}Code</a>` : "",
      project.demo ? `<a class="btn btn-ghost btn-sm" href="${escapeAttr(project.demo)}" target="_blank" rel="noopener noreferrer">${icons().svg("arrow-up-right")}Live demo</a>` : ""
    ].join("");
  }

  /* Tech stack ------------------------------------------------------------- */
  function stackTabs(techStack) {
    return [{ id: "all", label: "All" }, ...(techStack || [])].map((group, index) => `<button class="filter-btn${index === 0 ? " is-active" : ""}" type="button" aria-pressed="${index === 0}" data-stack="${escapeAttr(group.id)}">${escapeHtml(group.label)}</button>`).join("");
  }

  function stackPanels(techStack) {
    return (techStack || []).map((group) => `
      <section class="stack-group reveal" data-stack-group="${escapeAttr(group.id)}" aria-label="${escapeAttr(group.label)}">
        <h3>${escapeHtml(group.label)}</h3>
        <ul class="tech-grid">${group.items.map((item) => `
          <li class="tech-tile" tabindex="0" data-tooltip="${escapeAttr(item.name)}">
            <span class="tech-icon">${item.icon ? icons().brand(item.icon) : `<span class="tech-mono">${escapeHtml(item.mono || item.name.slice(0, 2))}</span>`}</span>
            <span class="tech-name">${escapeHtml(item.name)}</span>
          </li>`).join("")}
        </ul>
      </section>`).join("");
  }

  // The stack as an endless strip; the second copy is decorative, for a seamless loop.
  function marquee(techStack) {
    const items = (techStack || []).flatMap((group) => group.items || []);
    const list = (hidden) => `<ul class="marquee-list"${hidden ? ' aria-hidden="true"' : ""}>${items.map((item) => `
      <li>${item.icon ? icons().brand(item.icon) : `<span class="marquee-mono">${escapeHtml(item.mono || item.name.slice(0, 2))}</span>`}${escapeHtml(item.name)}</li>`).join("")}</ul>`;
    return list(false) + list(true);
  }

  /* FAQ -------------------------------------------------------------------- */
  // The visible FAQ and the FAQPage JSON-LD come from the same entries, so their answers always match.
  function faq(entries) {
    return (entries || []).map((entry, index) => `
      <details class="faq-item reveal"${index === 0 ? " open" : ""}>
        <summary><h3>${escapeHtml(entry.question)}</h3>${icons().svg("chevron-down")}</summary>
        <p>${escapeHtml(entry.answer)}</p>
      </details>`).join("");
  }

  function faqSchema(entries) {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: (entries || []).map((entry) => ({
        "@type": "Question",
        name: entry.question,
        acceptedAnswer: { "@type": "Answer", text: entry.answer }
      }))
    };
  }

  /* Contact ---------------------------------------------------------------- */
  function contactList(contact) {
    const rows = [];
    if (contact.email) rows.push(`<li><span class="contact-icon">${icons().svg("mail")}</span><div><span class="contact-label">Email</span><a href="mailto:${escapeAttr(contact.email)}">${escapeHtml(contact.email).replace("@", "@<wbr>")}</a></div><button class="copy-btn" type="button" data-copy="${escapeAttr(contact.email)}" aria-label="Copy email address">${icons().svg("copy")}<span>Copy</span></button></li>`);
    if (contact.phone) rows.push(`<li><span class="contact-icon">${icons().svg("phone")}</span><div><span class="contact-label">Mobile</span><a href="tel:${escapeAttr(contact.phone)}">${escapeHtml(contact.phoneDisplay || contact.phone)}</a></div></li>`);
    if (contact.location) rows.push(`<li><span class="contact-icon">${icons().svg("map-pin")}</span><div><span class="contact-label">Location</span><span>${escapeHtml(contact.location)}</span></div></li>`);
    return rows.join("");
  }

  window.PortfolioTemplates = {
    escapeHtml, escapeAttr, pad, projectHref,
    heroTags, socialLinks, aboutCopy, timeline,
    projectSlides, moreProjects, projectFilters, media,
    stackTabs, stackPanels, marquee, faq, faqSchema, contactList
  };
})();
