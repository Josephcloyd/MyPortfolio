/* Printable resume rendered from content.js. */
(function () {
  const content = window.PORTFOLIO_CONTENT;
  const root = document.querySelector("[data-resume]");
  document.querySelector("#printResume")?.addEventListener("click", () => window.print());
  if (!content || !root) return;

  const profile = content.profile || {};
  const contact = content.contact || {};
  const socials = content.socials || {};

  const pdf = document.querySelector("[data-resume-pdf]");
  if (pdf && content.resume?.file) { pdf.href = encodeURI(content.resume.file); pdf.setAttribute("download", ""); pdf.hidden = false; }

  const contactBits = [
    contact.email ? `<a href="mailto:${escapeAttr(contact.email)}">${escapeHtml(contact.email)}</a>` : "",
    contact.phone ? `<a href="tel:${escapeAttr(contact.phone)}">${escapeHtml(contact.phoneDisplay || contact.phone)}</a>` : "",
    contact.location ? `<span>${escapeHtml(contact.location)}</span>` : "",
    link(socials.github),
    link(socials.linkedin)
  ].filter(Boolean);

  const projects = [...(content.projects || []), ...(content.moreProjects || [])];

  root.innerHTML = `
    <header class="resume-head">
      <h1>${escapeHtml(profile.name)}</h1>
      <p class="resume-headline">${(profile.headline || []).map(escapeHtml).join(" · ")}</p>
      <p class="resume-contact">${contactBits.join('<span aria-hidden="true">/</span>')}</p>
    </header>
    ${section("Profile", `<p>${escapeHtml(profile.intro)}</p>`)}
    ${section("Experience", (content.experience || []).map((job) => `
      <div class="resume-item">
        <div class="resume-item-head"><h3>${escapeHtml(job.company)}${job.role ? ` <span>— ${escapeHtml(job.role)}</span>` : ""}</h3><time>${escapeHtml(job.period)}</time></div>
        ${(job.responsibilities || []).length ? `<ul>${job.responsibilities.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
      </div>`).join(""))}
    ${section("Projects", projects.map((project) => `
      <div class="resume-item">
        <div class="resume-item-head"><h3>${escapeHtml(project.title)} <span>— ${escapeHtml(project.tagline || project.category)}</span></h3></div>
        <p>${escapeHtml(project.summary)}</p>
        ${(project.tech || []).length ? `<p class="resume-tech">${project.tech.map(escapeHtml).join(" · ")}</p>` : ""}
      </div>`).join(""))}
    ${section("Technical skills", `<dl class="resume-skills">${(content.techStack || []).map((group) => `<div><dt>${escapeHtml(group.label)}</dt><dd>${group.items.map((item) => escapeHtml(item.name)).join(", ")}</dd></div>`).join("")}</dl>`)}
    ${(content.education || []).length ? section("Education", content.education.map((entry) => `
      <div class="resume-item"><div class="resume-item-head"><h3>${escapeHtml(entry.title)} <span>— ${escapeHtml(entry.place)}</span></h3>${entry.note ? `<time>${escapeHtml(entry.note)}</time>` : ""}</div></div>`).join("")) : ""}`;

  function section(title, body) { return `<section class="resume-section"><h2>${escapeHtml(title)}</h2>${body}</section>`; }
  function link(url) {
    const safe = window.PortfolioSecurity?.externalUrl(url) || "";
    return safe ? `<a href="${escapeAttr(safe)}" target="_blank" rel="noopener noreferrer">${escapeHtml(safe.replace(/^https?:\/\//, "").replace(/\/$/, ""))}</a>` : "";
  }
  function escapeHtml(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
  function escapeAttr(value) { return escapeHtml(value).replaceAll("`", "&#096;"); }
})();
