(async function () {
  document.querySelector("#printResume")?.addEventListener("click", () => window.print());
  const config = window.PORTFOLIO_SITE || {};
  document.querySelectorAll("[data-contact-email]").forEach((link) => { if (config.contactEmail) { link.href = `mailto:${config.contactEmail}`; link.textContent = config.contactEmail; link.hidden = false; } });
  if (!window.PortfolioStore) return;
  const items = await window.PortfolioStore.loadItems();
  render("#resumeSkills", items.filter((item) => item.type === "skill"), (item) => `<article><h3>${safe(item.title)}</h3><p>${safe((item.tags || []).join(" · "))}</p></article>`);
  render("#resumeProjects", items.filter((item) => item.type === "project").slice(0, 5), (item) => `<article><div><h3>${safe(item.title)}</h3><span>${safe(item.category)} / ${safe(item.subtitle)}</span></div><p>${safe(item.description)}</p></article>`);
  render("#resumeTimeline", items.filter((item) => item.type === "experience"), (item) => `<article><div><h3>${safe(item.title)}</h3><span>${safe(item.category)} / ${safe(item.subtitle)}</span></div><p>${safe(item.description)}</p></article>`);
  const certificates = items.filter((item) => item.type === "certificate");
  render("#resumeCertificates", certificates, (item) => `<article><div><h3>${safe(item.title)}</h3><span>${safe(item.category)} / ${safe(item.subtitle)}</span></div></article>`, "Certificates will appear here when added.");
  function render(selector, collection, template, empty = "No records yet.") { const root = document.querySelector(selector); if (root) root.innerHTML = collection.length ? collection.map(template).join("") : `<p>${empty}</p>`; }
  function safe(value) { return String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
})();
