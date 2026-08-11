(function () {
  const config = window.PORTFOLIO_SUPABASE || {};
  const localHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);

  function externalUrl(value) {
    if (!value) return "";
    try {
      const url = new URL(String(value).trim(), window.location.href);
      if (url.protocol === "https:") return url.href;
      if (url.protocol === "http:" && localHosts.has(url.hostname)) return url.href;
    } catch (error) { /* Invalid or unsafe URL. */ }
    return "";
  }

  function imageUrl(value) {
    const raw = String(value || "").trim();
    if (/^data:image\/(png|jpeg|webp|gif);base64,/i.test(raw)) return raw;
    const safe = externalUrl(raw);
    if (!safe) return "";
    const allowed = new Set([window.location.hostname]);
    try { if (config.url) allowed.add(new URL(config.url).hostname); } catch (error) { /* Ignore invalid config. */ }
    try { return allowed.has(new URL(safe).hostname) ? safe : ""; } catch (error) { return ""; }
  }

  function email(value) {
    const candidate = String(value || "").trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate) ? candidate : "";
  }

  window.PortfolioSecurity = { externalUrl, imageUrl, email };
})();
