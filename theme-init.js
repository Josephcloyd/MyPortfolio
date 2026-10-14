/* Applies the saved theme before first paint. Loaded synchronously in <head>. Dark is the default. */
(function () {
  var theme = "dark";
  try { if (localStorage.getItem("portfolio-theme") === "light") theme = "light"; } catch (error) { /* Storage unavailable. */ }
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.add("js");
  if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) document.documentElement.classList.add("can-reveal");
})();
