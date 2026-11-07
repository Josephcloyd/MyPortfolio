/* Applies the saved theme before first paint. Loaded synchronously in <head>. Dark is the default. */
(function () {
  var theme = "dark";
  try { if (localStorage.getItem("portfolio-theme") === "light") theme = "light"; } catch (error) { /* Storage unavailable. */ }
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.add("js");
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if ("IntersectionObserver" in window && !reduced) document.documentElement.classList.add("can-reveal");
  // The loading screen plays once per browser tab; repeat visits and reduced-motion users skip it.
  var seen = false;
  try { seen = sessionStorage.getItem("portfolio-loaded") === "1"; } catch (error) { /* Storage unavailable. */ }
  if (seen || reduced) document.documentElement.classList.add("skip-loader");
})();
