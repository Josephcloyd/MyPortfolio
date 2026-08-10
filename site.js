(function () {
  document.querySelectorAll("[data-year]").forEach((node) => { node.textContent = new Date().getFullYear(); });
  const config = window.PORTFOLIO_SITE || {};
  [["github", config.githubUrl], ["linkedin", config.linkedinUrl]].forEach(([name, url]) => {
    document.querySelectorAll(`[data-social="${name}"]`).forEach((link) => { if (url) { link.href = url; link.hidden = false; link.target = "_blank"; link.rel = "noreferrer"; } });
  });

  const navLinks = [...document.querySelectorAll('.nav-links a[href^="#"]')];
  const sections = navLinks.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) navLinks.forEach((link) => link.classList.toggle("is-current", link.getAttribute("href") === `#${entry.target.id}`));
    }), { rootMargin: "-25% 0px -65%" });
    sections.forEach((section) => sectionObserver.observe(section));
    const revealObserver = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add("is-visible"); revealObserver.unobserve(entry.target); } }), { threshold: 0.08 });
    const observeReveals = () => document.querySelectorAll(".reveal-item:not([data-reveal-wired])").forEach((node) => { node.dataset.revealWired = "true"; revealObserver.observe(node); });
    observeReveals();
    document.addEventListener("portfolio:rendered", observeReveals);
  }

  const consolePanel = document.querySelector(".spatial-console");
  if (consolePanel && matchMedia("(pointer:fine) and (prefers-reduced-motion:no-preference)").matches) {
    consolePanel.addEventListener("pointermove", (event) => {
      const box = consolePanel.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - 0.5;
      const y = (event.clientY - box.top) / box.height - 0.5;
      consolePanel.style.transform = `rotateX(${3 - y * 4}deg) rotateY(${-7 + x * 5}deg)`;
    });
    consolePanel.addEventListener("pointerleave", () => { consolePanel.style.transform = "rotateX(3deg) rotateY(-7deg)"; });
  }

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
})();
