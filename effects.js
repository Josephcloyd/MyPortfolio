/* Page effects for the home page: loading screen, hero intro, code typing, cursor spotlight,
 * magnetic buttons, scroll progress, and heading word reveals.
 *
 * Patterns follow ones common on developer sites and UI kits (terminal boot loaders, Linear/Vercel-style
 * cursor spotlights, Magic UI / Aceternity-style text reveals and typing). Every effect is optional:
 * reduced-motion users get none of the movement, and the page stays fully usable if this file or
 * vendor/motion.min.js fails to load (effects.css has fail-safes for anything hidden up front).
 */
(function () {
  const root = document.documentElement;
  const motion = window.Motion;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $ = (selector) => document.querySelector(selector);
  const EASE = [0.2, 0.7, 0.2, 1];

  const LOADER_MIN_MS = 1900;   // long enough for the logo to finish drawing (see effects.css)
  const LOADER_MAX_MS = 3400;   // never hold the page longer than this
  const LOADER_EXIT_MS = 1100;  // panel split + fade, matches .loader transitions in effects.css
  const LOADER_STEPS = [[0, "Initializing"], [35, "Loading projects"], [70, "Preparing interface"]];
  const TYPE_MS_PER_CHAR = 7;
  const TYPE_LINE_CAP_MS = 380;
  const TYPE_LINE_GAP_MS = 40;
  const SCRAMBLE_MS = 900;
  const SCRAMBLE_GLYPHS = "!<>-_\\/[]{}=+*^?#01";
  const MAGNET_PULL = 0.25;
  const MAGNET_MAX_PX = 8;
  const SPOTLIGHT_TARGETS = ".slide-card, .tech-tile, .editor, .contact-form";
  const TILE_TILT_DEG = 14;     // max tilt of a tech tile toward the cursor
  const EDITOR_TILT_DEG = 6;    // max tilt of the hero code window toward the cursor

  const hero = $(".hero");
  const showLoader = Boolean($("[data-loader]")) && !root.classList.contains("skip-loader");
  const playIntro = showLoader && Boolean(motion) && !reduced;
  if (playIntro) prepareIntro();

  runLoader().then(() => {
    startTyping();
    if (playIntro) playHeroIntro(); else hero?.classList.remove("is-pre");
  });
  wireTyping();
  wireScrollProgress();
  wireHeadingReveals();
  wireStackTiles();
  if (finePointer && !reduced) { wireSpotlight(); wireMagnetic(); wireEditorTilt(); }

  /* Loading screen ---------------------------------------------------------- */
  function runLoader() {
    const loader = $("[data-loader]");
    if (!loader) return Promise.resolve();
    if (!showLoader) { loader.remove(); return Promise.resolve(); }

    const start = performance.now();
    const pct = loader.querySelector("[data-loader-pct]");
    const status = loader.querySelector("[data-loader-status]");
    const name = loader.querySelector("[data-loader-name]");
    if (name) setTimeout(() => scramble(name), 700);
    let complete = false;
    let shown = 0;
    // Creep toward 90% while loading, then run to 100% once the page is ready.
    const tick = () => {
      const target = complete ? 100 : Math.min(90, ((performance.now() - start) / LOADER_MIN_MS) * 90);
      shown += (target - shown) * 0.18;
      const value = complete && target - shown < 0.5 ? 100 : shown;
      loader.style.setProperty("--p", value.toFixed(1));
      if (pct) pct.textContent = String(Math.round(value));
      if (status && !complete) status.textContent = LOADER_STEPS.filter(([from]) => value >= from).pop()[1];
      if (value < 100) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    const pageLoaded = new Promise((resolve) => (document.readyState === "complete" ? resolve() : window.addEventListener("load", resolve, { once: true })));
    const ready = Promise.all([pageLoaded, wait(LOADER_MIN_MS)]);
    return Promise.race([ready, wait(LOADER_MAX_MS)]).then(() => {
      complete = true;
      if (status) status.textContent = `Ready in ${((performance.now() - start) / 1000).toFixed(1)}s`;
      loader.classList.add("is-ready");
      return wait(550);
    }).then(() => {
      loader.classList.add("is-done");
      loader.setAttribute("aria-busy", "false");
      try { sessionStorage.setItem("portfolio-loaded", "1"); } catch (error) { /* Storage unavailable. */ }
      setTimeout(() => loader.remove(), LOADER_EXIT_MS);
      return wait(LOADER_EXIT_MS * 0.45); // start the hero intro while the curtain is still lifting
    });
  }

  /* Hero intro: name rises word by word, headline decodes, the rest fades up --- */
  function prepareIntro() {
    if (!hero) return;
    const title = hero.querySelector(".hero-title");
    if (title) splitWords(title);
    hero.classList.add("is-pre");
  }

  function playHeroIntro() {
    hero.classList.remove("is-pre");
    const words = hero.querySelectorAll(".hero-title .word-inner");
    motion.animate(words, { transform: ["translateY(105%)", "none"] }, { delay: motion.stagger(0.09), duration: 0.9, ease: EASE });
    const parts = [".hero-status", ".hero-headline", ".hero-intro", ".hero-actions", ".hero-meta"].map((selector) => hero.querySelector(selector)).filter(Boolean);
    motion.animate(parts, { opacity: [0, 1], transform: ["translateY(14px)", "none"] }, { delay: motion.stagger(0.08, { startDelay: 0.25 }), duration: 0.7, ease: EASE });
    const editor = hero.querySelector(".editor");
    if (editor) motion.animate(editor, { opacity: [0, 1], transform: ["translateY(24px) scale(0.97)", "none"] }, { delay: 0.35, duration: 0.9, ease: EASE });
    const headline = hero.querySelector(".hero-headline");
    if (headline) setTimeout(() => scramble(headline), 350);
  }

  // Decodes the headline from random glyphs, left to right, then restores the original markup.
  function scramble(element) {
    const finalHtml = element.innerHTML;
    const finalText = element.textContent;
    const start = performance.now();
    const frame = () => {
      const progress = Math.min(1, (performance.now() - start) / SCRAMBLE_MS);
      const revealed = Math.floor(progress * finalText.length);
      element.textContent = [...finalText].map((char, index) => {
        if (index < revealed || /[\s•]/.test(char)) return char;
        return SCRAMBLE_GLYPHS[Math.floor(Math.random() * SCRAMBLE_GLYPHS.length)];
      }).join("");
      if (progress < 1) requestAnimationFrame(frame); else element.innerHTML = finalHtml;
    };
    requestAnimationFrame(frame);
  }

  /* Code panel typing ------------------------------------------------------- */
  // Each line gets its character count and start time; effects.css types it with steps().
  function startTyping() {
    const code = $("[data-editor-code]");
    if (!code || reduced) return;
    timeLines(code);
    code.classList.add("is-typing");
    code.closest(".editor-code")?.classList.add("is-typing"); // the <pre> the typing rules in effects.css target
    code.closest(".editor")?.classList.add("is-typing"); // lets the terminal pane type after the code
  }

  function wireTyping() {
    const code = $("[data-editor-code]");
    if (!code || reduced) return;
    // Switching editor tabs re-renders the lines; time the new ones too.
    new MutationObserver(() => { if (code.classList.contains("is-typing")) timeLines(code); }).observe(code, { childList: true });
  }

  function timeLines(code) {
    let at = 0;
    code.querySelectorAll(".line").forEach((line) => {
      const chars = Math.max(1, line.textContent.length);
      const duration = Math.min(chars * TYPE_MS_PER_CHAR, TYPE_LINE_CAP_MS);
      line.style.setProperty("--chars", String(chars));
      line.style.setProperty("--dur", `${duration}ms`);
      line.style.setProperty("--delay", `${at}ms`);
      at += duration + TYPE_LINE_GAP_MS;
    });
    // On the whole window so the terminal pane can start once the code has finished typing.
    (code.closest(".editor") || code).style.setProperty("--done", `${at}ms`);
  }

  /* Scroll progress bar ----------------------------------------------------- */
  function wireScrollProgress() {
    const bar = $("[data-scroll-progress]");
    if (!bar || !motion || reduced) { bar?.remove(); return; }
    root.classList.add("has-scroll-progress");
    motion.scroll(motion.animate(bar, { transform: ["scaleX(0)", "scaleX(1)"] }, { ease: "linear" }));
  }

  /* Section headings: words rise into place on scroll ----------------------- */
  function wireHeadingReveals() {
    if (!motion || reduced) return;
    document.querySelectorAll(".section-head h2, .contact-copy h2").forEach((heading) => {
      splitWords(heading);
      const words = heading.querySelectorAll(".word-inner");
      words.forEach((word) => { word.style.transform = "translateY(105%)"; });
      const stop = motion.inView(heading, () => {
        stop();
        motion.animate(words, { transform: ["translateY(105%)", "none"] }, { delay: motion.stagger(0.06), duration: 0.8, ease: EASE });
      }, { amount: 0.4 });
    });
  }

  // Wraps each word in a clipping span so it can rise from below. Text stays real text for screen readers.
  function splitWords(element) {
    if (element.dataset.split) return;
    element.dataset.split = "true";
    const words = element.textContent.trim().split(/\s+/);
    element.innerHTML = words.map((word) => `<span class="word"><span class="word-inner">${escapeHtml(word)}</span></span>`).join(" ");
  }

  /* Tech stack tiles: flip up into place per category, then tilt toward the cursor in 3D --- */
  function wireStackTiles() {
    const panels = $("[data-stack-panels]");
    if (!panels || reduced || !("IntersectionObserver" in window)) return;
    panels.querySelectorAll(".stack-group").forEach((group) => {
      group.querySelectorAll(".tech-tile").forEach((tile, index) => tile.style.setProperty("--i", String(index)));
    });
    panels.classList.add("flip-ready"); // effects.css hides tiles only once this class is present
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-in");
      observer.unobserve(entry.target);
    }), { threshold: 0.15 });
    panels.querySelectorAll(".stack-group").forEach((group) => observer.observe(group));
    if (!finePointer) return;

    panels.addEventListener("pointermove", (event) => {
      const tile = event.target.closest(".tech-tile");
      if (!tile) return;
      const box = tile.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - 0.5;
      const y = (event.clientY - box.top) / box.height - 0.5;
      tile.style.setProperty("--ry", `${(x * TILE_TILT_DEG * 2).toFixed(1)}deg`);
      tile.style.setProperty("--rx", `${(-y * TILE_TILT_DEG * 2).toFixed(1)}deg`);
    }, { passive: true });
    panels.addEventListener("pointerout", (event) => {
      const tile = event.target.closest(".tech-tile");
      if (tile && !tile.contains(event.relatedTarget)) { tile.style.setProperty("--rx", "0deg"); tile.style.setProperty("--ry", "0deg"); }
    });
  }

  /* Cursor spotlight on cards (Linear / Vercel style) ----------------------- */
  function wireSpotlight() {
    document.addEventListener("pointermove", (event) => {
      const target = event.target.closest(SPOTLIGHT_TARGETS);
      if (!target) return;
      const box = target.getBoundingClientRect();
      target.style.setProperty("--mx", `${event.clientX - box.left}px`);
      target.style.setProperty("--my", `${event.clientY - box.top}px`);
    }, { passive: true });
  }

  /* Hero code window tilts gently toward the cursor ------------------------- */
  function wireEditorTilt() {
    const wrap = $("[data-editor-wrap]");
    if (!wrap) return;
    wrap.addEventListener("pointermove", (event) => {
      const box = wrap.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - 0.5;
      const y = (event.clientY - box.top) / box.height - 0.5;
      wrap.style.setProperty("--ery", `${(x * EDITOR_TILT_DEG * 2).toFixed(2)}deg`);
      wrap.style.setProperty("--erx", `${(-y * EDITOR_TILT_DEG * 2).toFixed(2)}deg`);
    }, { passive: true });
    wrap.addEventListener("pointerleave", () => { wrap.style.setProperty("--erx", "0deg"); wrap.style.setProperty("--ery", "0deg"); });
  }

  /* Magnetic buttons -------------------------------------------------------- */
  function wireMagnetic() {
    document.querySelectorAll(".hero-actions .btn, .nav-resume, .contact-actions .btn-primary").forEach((button) => {
      button.classList.add("magnetic");
      button.addEventListener("pointermove", (event) => {
        const box = button.getBoundingClientRect();
        const pull = (value) => Math.max(-MAGNET_MAX_PX, Math.min(MAGNET_MAX_PX, value * MAGNET_PULL));
        button.style.setProperty("--tx", `${pull(event.clientX - (box.left + box.width / 2))}px`);
        button.style.setProperty("--ty", `${pull(event.clientY - (box.top + box.height / 2))}px`);
      });
      button.addEventListener("pointerleave", () => { button.style.setProperty("--tx", "0px"); button.style.setProperty("--ty", "0px"); });
    });
  }

  function wait(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
  function escapeHtml(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
})();
