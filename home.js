/* Renders the home page from content.js, then overlays media, links, and certificates from Supabase. */
(function () {
  const content = window.PORTFOLIO_CONTENT;
  if (!content) return;
  const icons = window.PortfolioIcons || { svg: () => "", brand: () => "" };
  // Section markup lives in templates.js, shared with the build so the same HTML is pre-rendered for crawlers.
  const T = window.PortfolioTemplates;
  if (!T) return;
  const $ = (selector) => document.querySelector(selector);
  const profile = content.profile || {};
  const contact = content.contact || {};

  let projects = (content.projects || []).map((project) => ({ ...project }));
  let moreProjects = (content.moreProjects || []).map((project) => ({ ...project }));
  let activeFilter = "all";
  const carouselRoot = $("[data-carousel]");
  const carousel = carouselRoot && window.PortfolioCarousel ? window.PortfolioCarousel.create(carouselRoot) : null;

  renderHero();
  renderEditor("profile");
  renderAbout();
  renderTimeline();
  renderProjects();
  renderFilters();
  renderStack();
  renderMarquee();
  renderFaq();
  renderContact();
  wireEditorTabs();
  document.dispatchEvent(new CustomEvent("portfolio:rendered"));
  restoreHash();
  wireHeroDrift();
  loadRemote();

  // The code panel drifts up slightly as the hero scrolls away (Motion, wide screens with a mouse only).
  function wireHeroDrift() {
    const motion = window.Motion;
    const editor = $("[data-editor]");
    const hero = $("#home");
    if (!motion || !editor || !hero) return;
    if (!matchMedia("(min-width: 1000px) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;
    motion.scroll(motion.animate(editor, { transform: ["translateY(0px)", "translateY(-56px)"] }, { ease: "linear" }), { target: hero, offset: ["start start", "end start"] });
  }

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
    if (tags) tags.innerHTML = T.heroTags(profile);
    document.querySelectorAll("[data-profile-photo]").forEach((node) => {
      const avatar = profile.avatar || profile.photo;
      if (avatar) node.innerHTML = `<img src="${escapeAttr(avatar)}" alt="${escapeAttr(`Profile photo of ${profile.name}`)}" width="40" height="40" decoding="async" />`;
      else node.textContent = profile.monogram || "JD";
    });
  }

  /* Code editor */
  function renderEditor(file) {
    const code = $("[data-editor-code]");
    if (!code) return;
    const lines = file === "contact" ? contactLines() : profileLines();
    code.innerHTML = lines.map((line) => `<span class="line">${line || " "}</span>`).join("");
    const isContact = file === "contact";
    const lang = $("[data-editor-lang]");
    if (lang) lang.textContent = isContact ? "JSON" : "TypeScript";
    // Status bar and breadcrumb follow the open file, like VS Code.
    const lastLine = code.lastElementChild?.textContent || "";
    const pos = $("[data-editor-pos]");
    if (pos) pos.textContent = `Ln ${lines.length}, Col ${lastLine.length + 1}`;
    const crumbs = $("[data-editor-crumbs]");
    if (crumbs) crumbs.innerHTML = isContact ? "contact.json" : "src <span>›</span> profile.ts <span>›</span> developer";
    const terminal = $("[data-terminal-out]");
    if (terminal) terminal.textContent = `✓ ${[profile.availability, contact.location].filter(Boolean).join(" · ")}`;
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
    if (copy) copy.innerHTML = T.aboutCopy(about);
    const portrait = $("[data-portrait]");
    if (portrait && profile.photo) { portrait.classList.add("has-photo"); portrait.innerHTML = `<img src="${escapeAttr(profile.photo)}" alt="${escapeAttr(profile.photoAlt || profile.name)}" width="800" height="1000" loading="lazy" decoding="async" />`; }
  }

  /* Experience */
  function renderTimeline() {
    const root = $("[data-timeline]");
    if (!root) return;
    const wide = matchMedia("(min-width: 760px)");
    root.innerHTML = T.timeline(content.experience, projects, { expandAll: wide.matches });
    // The toggle is hidden on wide screens, so keep every list expanded there.
    wide.addEventListener("change", (event) => { if (event.matches) root.querySelectorAll("details.duties").forEach((node) => { node.open = true; }); });
  }

  /* Projects */
  // Main projects go into the 3D carousel (carousel.js handles layout and input); smaller builds stay a list.
  function renderProjects() {
    const track = $("[data-carousel-track]");
    const moreRoot = $("[data-more-projects]");

    if (track) track.innerHTML = T.projectSlides(projects);
    if (moreRoot) moreRoot.innerHTML = T.moreProjects(moreProjects);

    applyFilter();
  }

  function renderFilters() {
    const root = $("[data-project-filters]");
    if (!root) return;
    root.innerHTML = T.projectFilters(content.projectFilters, [...projects, ...moreProjects], activeFilter);
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
    carousel?.refresh();
  }

  /* Tech stack */
  function renderStack() {
    const tabs = $("[data-stack-tabs]");
    const panels = $("[data-stack-panels]");
    if (!tabs || !panels) return;
    tabs.innerHTML = T.stackTabs(content.techStack);
    panels.innerHTML = T.stackPanels(content.techStack);
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

  /* Tech marquee: the stack as an endless strip (second copy is decorative, for a seamless loop). */
  function renderMarquee() {
    const root = $("[data-marquee]");
    if (!root) return;
    root.innerHTML = T.marquee(content.techStack);
  }

  /* FAQ (also pre-rendered at build, with matching FAQPage JSON-LD) */
  function renderFaq() {
    const root = $("[data-faq]");
    if (root) root.innerHTML = T.faq(content.faq);
  }

  /* Contact */
  function renderContact() {
    const list = $("[data-contact-list]");
    if (!list) return;
    list.innerHTML = T.contactList(contact);
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
  function t(kind, value) { return `<span class="tok-${kind}">${escapeHtml(value)}</span>`; }
  function p(value) { return t("punc", value); }
  function str(value) { return t("str", `"${value}"`); }
  function stripProtocol(url) { return url ? String(url).replace(/^https?:\/\//, "").replace(/\/$/, "") : ""; }
  function escapeHtml(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
  function escapeAttr(value) { return escapeHtml(value).replaceAll("`", "&#096;"); }
})();
