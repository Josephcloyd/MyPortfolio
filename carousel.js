/* 3D rotating ring of project cards.
 *
 * home.js renders the slides; this file arranges them around a ring and turns it. Each slide sits
 * at a fixed angle (rotateY(i * step) translateZ(radius)); only the ring's rotation changes, so a
 * frame is one transform plus a little per-slide opacity. Styles are set through the CSSOM, which
 * keeps the strict CSP (no inline style attributes) intact.
 *
 * The ring turns slowly on its own. The arrows, Left/Right keys, a swipe, or a click on a side card
 * spin it to the next/previous/clicked project, then it resumes after a short pause. Hovering (or
 * touching) the front card stops it and eases that project to the front. It also stops when off
 * screen or in a hidden tab, and reduced-motion users get no automatic rotation.
 */
(function () {
  const SPEED_DEG_PER_SEC = 8;   // ~45 s per full turn with six projects
  const SNAP_MS = 1100;          // duration of an arrow/click spin to the next project
  const RESUME_AFTER_MS = 3000;  // pause after manual navigation before rotating again
  const HIDE_BEYOND_DEG = 100;   // cards turned further than this from the front are hidden
  const SWIPE_THRESHOLD = 48;    // px of horizontal travel that counts as a swipe
  const DRAG_CLICK_GUARD = 8;    // px of travel after which a pointer-up is not treated as a click
  const RING_GAP = 0.08;         // extra radius, as a fraction of card width, between neighbours
  const HOLD_TARGETS = ".slide.is-active .slide-card";

  function create(root) {
    const viewport = root.querySelector("[data-carousel-viewport]");
    const track = root.querySelector("[data-carousel-track]");
    const prev = root.querySelector("[data-carousel-prev]");
    const next = root.querySelector("[data-carousel-next]");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    let slides = [];
    let step = 360;              // degrees between neighbouring cards
    let radius = 0;
    let angle = 0;               // ring rotation; slide k is at the front when angle = k * step
    let active = -1;
    let tween = null;            // { from, to, start, duration } while spinning to a project
    let frame = null;
    let lastTime = 0;
    let holding = false;         // pointer resting on, or finger pressed on, the front card
    let keyboardFocus = false;
    let onScreen = false;
    let pausedUntil = 0;

    prev?.addEventListener("click", () => stepBy(-1));
    next?.addEventListener("click", () => stepBy(1));
    root.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") { event.preventDefault(); stepBy(-1, true); }
      if (event.key === "ArrowRight") { event.preventDefault(); stepBy(1, true); }
    });
    // A click on a side card spins it to the front instead of following its links.
    track.addEventListener("click", (event) => {
      const slide = event.target.closest("[data-slide]");
      if (!slide || slide.classList.contains("is-active")) return;
      event.preventDefault();
      spinTo(slides.indexOf(slide));
    });

    wireHold();
    wireSwipe();
    document.addEventListener("visibilitychange", wake);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; wake(); }, { threshold: 0.25 }).observe(root);
    } else onScreen = true;
    window.addEventListener("resize", () => requestAnimationFrame(placeSlides));

    /** Re-reads the visible slides (after rendering or filtering) and rebuilds the ring. */
    function refresh() {
      const all = [...track.querySelectorAll("[data-slide]")];
      all.forEach((slide) => slide.classList.remove("is-active"));
      slides = all.filter((slide) => !slide.hidden);
      root.hidden = slides.length === 0;
      [prev, next].forEach((button) => { if (button) button.hidden = slides.length < 2; });
      angle = 0;
      active = -1;
      tween = null;
      placeSlides();
      track.querySelectorAll("img").forEach((img) => { if (!img.complete) img.addEventListener("load", sizeTrack, { once: true }); });
      wake();
    }

    // Fixed position of every card on the ring; recomputed on refresh and resize.
    function placeSlides() {
      const count = slides.length;
      step = count ? 360 / count : 360;
      const width = slides[0]?.offsetWidth || 0;
      if (count >= 3) radius = (width / 2) / Math.tan(Math.PI / count) + width * RING_GAP;
      else radius = count === 2 ? width * 0.35 : 0;
      slides.forEach((slide, index) => {
        slide.style.transform = `rotateY(${index * step}deg) translateZ(${radius}px)`;
        slide.setAttribute("aria-label", `${index + 1} of ${count}`);
      });
      sizeTrack();
      render();
    }

    // Per frame: rotate the ring, fade cards by how far they are turned from the front.
    function render() {
      track.style.transform = `translateZ(${-radius}px) rotateY(${-angle}deg)`;
      slides.forEach((slide, index) => {
        const relative = wrapDegrees(index * step - angle);
        const away = Math.abs(relative);
        const hidden = away > HIDE_BEYOND_DEG;
        slide.style.opacity = hidden ? "0" : String(1 - Math.min(away / 90, 1) * 0.65);
        slide.style.setProperty("--dist", (away / step).toFixed(2));
        slide.classList.toggle("is-hidden", hidden);
      });
      const front = slides.length ? mod(Math.round(angle / step), slides.length) : -1;
      if (front !== active) setActive(front);
    }

    function setActive(index) {
      active = index;
      slides.forEach((slide, i) => {
        const isActive = i === index;
        slide.classList.toggle("is-active", isActive);
        slide.setAttribute("aria-hidden", String(!isActive));
        slide.querySelectorAll('a:not([aria-hidden="true"]), button').forEach((control) => { control.tabIndex = isActive ? 0 : -1; });
      });
    }

    function stepBy(direction, focusActive = false) {
      if (slides.length < 2) return;
      const base = tween ? tween.to : angle;
      spinToAngle((Math.round(base / step) + direction) * step);
      if (focusActive) whenSettled(() => slides[active]?.querySelector('a:not([aria-hidden="true"]), button')?.focus({ preventScroll: true }));
    }

    function spinTo(index) {
      if (index < 0) return;
      spinToAngle(angle + wrapDegrees(index * step - angle));
    }

    // Manual moves pause the slow rotation for a moment so the chosen project can be read.
    function spinToAngle(target, pause = true) {
      if (pause) {
        pausedUntil = performance.now() + RESUME_AFTER_MS;
        setTimeout(wake, RESUME_AFTER_MS + 20);
      }
      tween = { from: angle, to: target, start: performance.now(), duration: reduced ? 0 : SNAP_MS };
      wake();
    }

    function whenSettled(callback) {
      const check = () => (tween ? requestAnimationFrame(check) : callback());
      requestAnimationFrame(check);
    }

    function canRotate() {
      return !reduced && !holding && !keyboardFocus && onScreen && !document.hidden && slides.length > 1 && performance.now() >= pausedUntil;
    }

    function wake() {
      if (frame === null && (tween || canRotate())) {
        lastTime = performance.now();
        frame = requestAnimationFrame(tick);
      }
    }

    function tick(now) {
      const elapsed = Math.min(now - lastTime, 64); // avoid a jump after a background tab
      lastTime = now;
      if (tween) {
        const progress = tween.duration ? Math.min(1, (now - tween.start) / tween.duration) : 1;
        angle = tween.from + (tween.to - tween.from) * easeInOutCubic(progress);
        if (progress >= 1) tween = null;
      } else if (canRotate()) {
        angle += (SPEED_DEG_PER_SEC * elapsed) / 1000;
      }
      render();
      frame = tween || canRotate() ? requestAnimationFrame(tick) : null;
    }

    // Slides are absolutely positioned, so the track takes the height of the tallest one.
    function sizeTrack() {
      const tallest = slides.reduce((max, slide) => Math.max(max, slide.offsetHeight), 0);
      if (tallest) track.style.height = `${tallest}px`;
    }

    function wireHold() {
      const setHolding = (value) => {
        if (value === holding) return;
        holding = value;
        // Resting on the front card settles that project squarely to the front.
        if (holding && slides.length > 1) spinToAngle(Math.round(angle / step) * step, false);
        wake();
      };
      // The carousel spans the full window width, so only the front card holds it still.
      root.addEventListener("pointermove", (event) => {
        if (event.pointerType === "mouse") setHolding(Boolean(event.target.closest(HOLD_TARGETS)));
      }, { passive: true });
      root.addEventListener("pointerleave", (event) => { if (event.pointerType === "mouse") setHolding(false); });
      root.addEventListener("pointerdown", (event) => { if (event.pointerType !== "mouse") setHolding(true); });
      ["pointerup", "pointercancel"].forEach((type) => root.addEventListener(type, (event) => { if (event.pointerType !== "mouse") setHolding(false); }));
      root.addEventListener("focusin", (event) => { keyboardFocus = event.target.matches(":focus-visible"); wake(); });
      root.addEventListener("focusout", (event) => { if (!root.contains(event.relatedTarget)) { keyboardFocus = false; wake(); } });
    }

    function wireSwipe() {
      let startX = null;
      let travelled = 0;
      viewport.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) return;
        startX = event.clientX;
        travelled = 0;
      });
      viewport.addEventListener("pointermove", (event) => {
        if (startX !== null) travelled = event.clientX - startX;
      });
      const finish = () => {
        if (startX === null) return;
        if (Math.abs(travelled) >= SWIPE_THRESHOLD) stepBy(travelled < 0 ? 1 : -1);
        startX = null;
      };
      viewport.addEventListener("pointerup", finish);
      viewport.addEventListener("pointercancel", () => { startX = null; });
      viewport.addEventListener("pointerleave", finish);
      // A drag should not also open the card underneath it.
      viewport.addEventListener("click", (event) => {
        if (Math.abs(travelled) > DRAG_CLICK_GUARD) { event.preventDefault(); event.stopPropagation(); travelled = 0; }
      }, true);
    }

    return { refresh };
  }

  function wrapDegrees(value) { return ((value % 360) + 540) % 360 - 180; }
  function mod(value, length) { return ((value % length) + length) % length; }
  function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  window.PortfolioCarousel = { create };
})();
