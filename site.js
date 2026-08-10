(function () {
  const themeButtons = [...document.querySelectorAll("[data-theme-toggle]")];
  const savedTheme = localStorage.getItem("portfolio-theme");
  const preferredTheme = matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  setTheme(savedTheme || preferredTheme);

  themeButtons.forEach((button) => button.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    localStorage.setItem("portfolio-theme", nextTheme);
    setTheme(nextTheme);
  }));

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

  const setupCarousels = () => document.querySelectorAll("[data-carousel]:not([data-carousel-wired])").forEach((carousel) => {
    carousel.dataset.carouselWired = "true";
    const track = carousel.querySelector("[data-slide-track]");
    if (!track) return;
    carousel.querySelector("[data-slide-prev]")?.addEventListener("click", () => slide(track, -1));
    carousel.querySelector("[data-slide-next]")?.addEventListener("click", () => slide(track, 1));
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      let paused = false;
      const setPaused = (value) => { paused = value; };
      carousel.addEventListener("pointerenter", () => setPaused(true));
      carousel.addEventListener("pointerleave", () => setPaused(false));
      carousel.addEventListener("focusin", () => setPaused(true));
      carousel.addEventListener("focusout", () => setPaused(false));
      setInterval(() => {
        if (paused || document.hidden || document.body.classList.contains("modal-open")) return;
        autoSlide(track);
      }, 4200);
    }
  });
  setupCarousels();
  document.addEventListener("portfolio:rendered", setupCarousels);

  function slide(track, direction) {
    const card = [...track.children].find((node) => !node.hidden);
    const distance = card ? card.getBoundingClientRect().width + 18 : track.clientWidth * 0.85;
    track.scrollBy({ left: distance * direction, behavior: "smooth" });
  }

  function autoSlide(track) {
    const visibleCards = [...track.children].filter((node) => !node.hidden);
    if (visibleCards.length < 2 || track.scrollWidth <= track.clientWidth + 8) return;
    const nearEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 12;
    if (nearEnd) track.scrollTo({ left: 0, behavior: "smooth" });
    else slide(track, 1);
  }

  const modal = document.querySelector("#detailModal");
  let modalReturnFocus = null;
  if (modal) {
    const modalTitle = modal.querySelector("#modalTitle");
    const modalKicker = modal.querySelector("#modalKicker");
    const modalDescription = modal.querySelector("#modalDescription");
    const modalDetail = modal.querySelector("#modalDetail");
    const modalTags = modal.querySelector("#modalTags");
    const modalLink = modal.querySelector("#modalLink");

    document.addEventListener("click", (event) => {
      const card = event.target.closest("[data-modal-card]");
      if (!card || event.target.closest("a, button")) return;
      openModal(card);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.hidden) closeModal();
      if ((event.key === "Enter" || event.key === " ") && event.target.matches("[data-modal-card]")) {
        event.preventDefault();
        openModal(event.target);
      }
    });

    modal.querySelectorAll("[data-modal-close]").forEach((node) => node.addEventListener("click", closeModal));

    function openModal(card) {
      modalReturnFocus = document.activeElement;
      modalKicker.textContent = card.dataset.modalKicker || "Details";
      modalTitle.textContent = card.dataset.modalTitle || card.querySelector("h3")?.textContent || "Portfolio detail";
      modalDescription.textContent = card.dataset.modalDescription || card.querySelector("p")?.textContent || "";
      modalDetail.textContent = card.dataset.modalDetails || "";
      modalTags.innerHTML = (card.dataset.modalTags || "").split("|").filter(Boolean).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
      if (card.dataset.modalLink) {
        modalLink.href = card.dataset.modalLink;
        modalLink.hidden = false;
      } else {
        modalLink.removeAttribute("href");
        modalLink.hidden = true;
      }
      modal.hidden = false;
      document.body.classList.add("modal-open");
      modal.querySelector("[data-modal-close]")?.focus();
    }

    function closeModal() {
      modal.hidden = true;
      document.body.classList.remove("modal-open");
      if (modalReturnFocus && typeof modalReturnFocus.focus === "function") modalReturnFocus.focus();
    }
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

  function escapeHtml(value) {
    return String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }

  function setTheme(theme) {
    const resolvedTheme = theme === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = resolvedTheme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", resolvedTheme === "light" ? "#f5f1e9" : "#10120f");
    themeButtons.forEach((button) => {
      const isLight = resolvedTheme === "light";
      button.setAttribute("aria-pressed", String(isLight));
      button.querySelector("[data-theme-icon]").textContent = isLight ? "☀" : "☾";
    });
  }
})();
