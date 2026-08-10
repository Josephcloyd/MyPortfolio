(function () {
  const form = document.querySelector("#contactForm");
  const status = document.querySelector("#contactStatus");
  if (!form || !window.PortfolioStore) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (document.querySelector("#contactWebsite").value) return;
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    status.textContent = "Transmitting message...";
    try {
      await window.PortfolioStore.submitMessage({ name: value("#contactName"), email: value("#contactEmail"), subject: value("#contactSubject"), message: value("#contactMessage") });
      form.reset();
      status.textContent = window.PortfolioStore.hasSupabaseConfig() ? "Message received. I’ll get back to you soon." : "Message saved in local preview mode.";
    } catch (error) { status.textContent = error.message || "Could not send the message."; }
    finally { button.disabled = false; }
  });
  function value(selector) { return document.querySelector(selector).value.trim(); }
})();
