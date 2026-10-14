/* Shared page behaviour: theme, navigation, reveal animations, resume/social links, copy-to-clipboard. */
(function () {
  const content = window.PORTFOLIO_CONTENT || {};
  const config = window.PORTFOLIO_SITE || {};
  const icons = window.PortfolioIcons;
  const root = document.documentElement;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

  /* Theme */
  const themeButtons = [...document.querySelectorAll("[data-theme-toggle]")];
  setTheme(root.dataset.theme === "light" ? "light" : "dark");
  themeButtons.forEach((button) => button.addEventListener("click", () => {
    const next = root.dataset.theme === "light" ? "dark" : "light";
    try { localStorage.setItem("portfolio-theme", next); } catch (error) { /* Storage unavailable. */ }
    setTheme(next);
  }));

  function setTheme(theme) {
    root.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "light" ? "#fafafa" : "#09090b");
    themeButtons.forEach((button) => {
      const isLight = theme === "light";
      button.setAttribute("aria-label", isLight ? "Switch to dark theme" : "Switch to light theme");
      if (icons) button.innerHTML = icons.svg(isLight ? "moon" : "sun");
    });
  }

  /* Static bindings */
  document.querySelectorAll("[data-year]").forEach((node) => { node.textContent = new Date().getFullYear(); });

  const resume = content.resume || {};
  const resumeFile = resume.file ? encodeURI(resume.file) : "";
  document.querySelectorAll("[data-resume-link]").forEach((link) => {
    if (resumeFile) { link.href = resumeFile; link.setAttribute("download", ""); }
    else link.href = resume.page || "resume.html";
  });

  const socials = socialLinks();
  document.querySelectorAll("[data-socials]").forEach((list) => {
    list.innerHTML = socials.map((entry) => `<li><a class="icon-btn" href="${escapeAttr(entry.href)}" aria-label="${escapeAttr(entry.label)}" title="${escapeAttr(entry.label)}"${entry.external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${icons ? icons.svg(entry.icon) : escapeHtml(entry.label)}</a></li>`).join("");
  });

  function socialLinks() {
    const safe = window.PortfolioSecurity?.externalUrl || ((value) => value);
    const links = [];
    const github = safe((content.socials || {}).github || config.githubUrl);
    const linkedin = safe((content.socials || {}).linkedin || config.linkedinUrl);
    const email = (content.contact || {}).email || config.contactEmail;
    if (github) links.push({ href: github, label: "GitHub", icon: "github", external: true });
    if (linkedin) links.push({ href: linkedin, label: "LinkedIn", icon: "linkedin", external: true });
    if (email) links.push({ href: `mailto:${email}`, label: `Email ${email}`, icon: "mail" });
    return links;
  }

  /* Navigation */
  const nav = document.querySelector("[data-nav]");
  const menuButton = document.querySelector("[data-menu-toggle]");
  const navLinks = [...document.querySelectorAll("[data-nav-link]")];
  const backToTop = document.querySelector("[data-back-to-top]");

  const onScroll = () => {
    const y = window.scrollY;
    nav?.classList.toggle("is-scrolled", y > 8);
    if (backToTop) backToTop.hidden = y < 900;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  backToTop?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" });
    document.querySelector(".logo")?.focus({ preventScroll: true });
  });

  function setMenu(open) {
    if (!nav || !menuButton) return;
    nav.classList.toggle("menu-open", open);
    document.body.classList.toggle("no-scroll", open);
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (icons) menuButton.innerHTML = icons.svg(open ? "x" : "menu");
  }
  menuButton?.addEventListener("click", () => setMenu(menuButton.getAttribute("aria-expanded") !== "true"));
  navLinks.forEach((link) => link.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav?.classList.contains("menu-open")) { setMenu(false); menuButton.focus(); }
  });
  matchMedia("(min-width: 900px)").addEventListener("change", (event) => { if (event.matches) setMenu(false); });

  if ("IntersectionObserver" in window && navLinks.length) {
    const sections = navLinks.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);
    const spy = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        const active = link.getAttribute("href") === `#${entry.target.id}`;
        link.classList.toggle("is-active", active);
        if (active) link.setAttribute("aria-current", "true"); else link.removeAttribute("aria-current");
      });
    }), { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((section) => spy.observe(section));
  }

  /* Reveal on scroll */
  let revealObserver = null;
  if ("IntersectionObserver" in window && !reducedMotion.matches) {
    revealObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add("is-visible"); revealObserver.unobserve(entry.target); }
    }), { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  }
  const observeReveals = () => document.querySelectorAll(".reveal:not([data-reveal-wired])").forEach((node) => {
    node.dataset.revealWired = "true";
    if (revealObserver) revealObserver.observe(node); else node.classList.add("is-visible");
  });
  observeReveals();
  document.addEventListener("portfolio:rendered", observeReveals);

  /* Remember the project being opened, so the case-study page still knows which one to show
     if a preview tool or host drops the ?id= query string. */
  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href*="project.html?id="]');
    if (!link) return;
    try { sessionStorage.setItem("portfolio-last-project", new URL(link.href, location.href).searchParams.get("id") || ""); } catch (error) { /* Storage unavailable. */ }
  });

  /* Copy to clipboard */
  const toast = document.querySelector("[data-toast]");
  let toastTimer = null;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2400);
  }

  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-copy]");
    if (!button) return;
    const value = button.dataset.copy;
    let copied = false;
    try { await navigator.clipboard.writeText(value); copied = true; }
    catch (error) {
      const field = document.createElement("textarea");
      field.value = value;
      field.setAttribute("readonly", "");
      field.className = "visually-hidden";
      document.body.appendChild(field);
      field.select();
      try { copied = document.execCommand("copy"); } catch (fallbackError) { copied = false; }
      field.remove();
    }
    if (!copied) { showToast("Copy failed — please copy it manually."); return; }
    showToast("Email copied to clipboard");
    const original = button.innerHTML;
    button.classList.add("is-copied");
    if (icons) button.innerHTML = `${icons.svg("check")}<span>Copied</span>`;
    setTimeout(() => { button.innerHTML = original; button.classList.remove("is-copied"); }, 2000);
  });

  /* Optional analytics (configured in supabase-config.js) */
  if (config.analyticsId) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.analyticsId)}`;
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", config.analyticsId);
  }

  function escapeHtml(value) { return String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
  function escapeAttr(value) { return escapeHtml(value).replaceAll("`", "&#096;"); }
})();
