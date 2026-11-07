/* Rotating 3D "icon cloud" of the tech stack (in the spirit of Magic UI's Icon Cloud).
 *
 * Every item in content.techStack becomes a chip placed evenly on a sphere (Fibonacci lattice).
 * Each frame the points are rotated and projected: chips always face the viewer, while depth
 * drives size, opacity, and stacking so the cloud reads as a ball. It spins slowly on its own;
 * the mouse steers it, dragging flings it, and it rests when off screen. Reduced-motion users get
 * a still sphere. Decorative only (aria-hidden): the categorized grid below lists everything.
 */
(function () {
  const root = document.querySelector("[data-tech-sphere]");
  const content = window.PORTFOLIO_CONTENT;
  const icons = window.PortfolioIcons;
  if (!root || !content || !icons) return;

  const IDLE_SPEED = 0.0035;      // radians per frame at rest (~1 turn every 30 s at 60 fps)
  const STEER_SPEED = 0.02;       // max extra speed when the pointer is at the sphere's edge
  const DRAG_GAIN = 0.006;        // radians per px dragged
  const FRICTION = 0.94;          // velocity decay after a fling
  const MIN_SCALE = 0.55;         // size of chips at the far side
  const MIN_OPACITY = 0.18;

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const items = (content.techStack || []).flatMap((group) => group.items || []);
  const escapeHtml = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

  root.innerHTML = `<div class="sphere-stage">${items.map((item) => `
    <span class="sphere-chip" data-name="${escapeHtml(item.name)}">${item.icon ? icons.brand(item.icon) : `<b>${escapeHtml(item.mono || item.name.slice(0, 2))}</b>`}</span>`).join("")}</div>`;
  const chips = [...root.querySelectorAll(".sphere-chip")];

  // Evenly spread unit vectors over the sphere.
  const points = chips.map((_, index) => {
    const y = 1 - (index / Math.max(1, chips.length - 1)) * 2;
    const ring = Math.sqrt(1 - y * y);
    const theta = index * Math.PI * (3 - Math.sqrt(5));
    return [Math.cos(theta) * ring, y, Math.sin(theta) * ring];
  });

  let rotX = -0.25;
  let rotY = 0;
  let velX = 0;
  let velY = IDLE_SPEED;
  let steerX = 0;
  let steerY = 0;
  let dragging = null;
  let onScreen = false;
  let frame = null;

  function render() {
    const radius = root.clientWidth * 0.38;
    const cosX = Math.cos(rotX), sinX = Math.sin(rotX), cosY = Math.cos(rotY), sinY = Math.sin(rotY);
    points.forEach(([x, y, z], index) => {
      // Rotate around Y, then X.
      const x1 = x * cosY + z * sinY;
      const z1 = -x * sinY + z * cosY;
      const y2 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;
      const depth = (z2 + 1) / 2; // 0 = back, 1 = front
      const chip = chips[index];
      chip.style.transform = `translate(-50%, -50%) translate3d(${(x1 * radius).toFixed(1)}px, ${(y2 * radius).toFixed(1)}px, 0) scale(${(MIN_SCALE + depth * (1 - MIN_SCALE)).toFixed(3)})`;
      chip.style.opacity = (MIN_OPACITY + depth * (1 - MIN_OPACITY)).toFixed(3);
      chip.style.zIndex = String(Math.round(depth * 100));
      chip.classList.toggle("is-front", depth > 0.82);
    });
  }

  function tick() {
    if (!dragging) {
      // Ease toward the idle spin plus any pointer steering; a fling decays into it.
      velX = velX * FRICTION + steerX * (1 - FRICTION);
      velY = velY * FRICTION + (IDLE_SPEED + steerY) * (1 - FRICTION);
    }
    rotX = Math.max(-1.2, Math.min(1.2, rotX + velX));
    rotY += velY;
    render();
    frame = onScreen && !document.hidden ? requestAnimationFrame(tick) : null;
  }

  function wake() {
    if (!reduced && frame === null && onScreen && !document.hidden) frame = requestAnimationFrame(tick);
  }

  render();
  window.addEventListener("resize", () => requestAnimationFrame(render));
  if (reduced) return;

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; wake(); }).observe(root);
  } else { onScreen = true; wake(); }
  document.addEventListener("visibilitychange", wake);

  // Steer: the further the pointer is from the centre, the faster it turns that way.
  root.addEventListener("pointermove", (event) => {
    const box = root.getBoundingClientRect();
    const dx = (event.clientX - (box.left + box.width / 2)) / (box.width / 2);
    const dy = (event.clientY - (box.top + box.height / 2)) / (box.height / 2);
    if (dragging) {
      velY = (event.clientX - dragging.x) * DRAG_GAIN;
      velX = -(event.clientY - dragging.y) * DRAG_GAIN;
      dragging = { x: event.clientX, y: event.clientY };
      rotY += velY;
      rotX = Math.max(-1.2, Math.min(1.2, rotX + velX));
      render();
      return;
    }
    if (event.pointerType === "mouse") { steerY = dx * STEER_SPEED; steerX = -dy * STEER_SPEED * 0.6; }
  });
  root.addEventListener("pointerleave", () => { steerX = 0; steerY = 0; });
  root.addEventListener("pointerdown", (event) => {
    dragging = { x: event.clientX, y: event.clientY };
    root.setPointerCapture(event.pointerId);
    root.classList.add("is-dragging");
  });
  const release = () => { dragging = null; root.classList.remove("is-dragging"); };
  root.addEventListener("pointerup", release);
  root.addEventListener("pointercancel", release);
})();
