(function () {
  const form = document.querySelector("#contactForm");
  const status = document.querySelector("#contactStatus");
  const widget = document.querySelector("#turnstileWidget");
  const button = form?.querySelector('button[type="submit"]');
  const config = window.PORTFOLIO_SITE || {};
  let turnstileToken = "";
  let widgetId = null;
  if (!form || !window.PortfolioStore) return;

  if (window.PortfolioStore.hasSupabaseConfig()) setupTurnstile();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (document.querySelector("#contactWebsite").value) return;
    if (window.PortfolioStore.hasSupabaseConfig() && !turnstileToken) { status.textContent = "Please complete the verification before sending your message."; return; }
    button.disabled = true;
    status.textContent = "Sending secure message...";
    try {
      await window.PortfolioStore.submitMessage({ name: value("#contactName"), email: value("#contactEmail"), subject: value("#contactSubject"), message: value("#contactMessage"), turnstileToken });
      form.reset();
      turnstileToken = "";
      if (widgetId !== null && window.turnstile) window.turnstile.reset(widgetId);
      status.textContent = window.PortfolioStore.hasSupabaseConfig() ? "Message received. I’ll get back to you soon." : "Message saved in local preview mode.";
    } catch (error) { status.textContent = error.message || "Could not send the message."; }
    finally { button.disabled = false; }
  });

  function setupTurnstile() {
    if (!config.turnstileSiteKey) { button.disabled = true; status.textContent = "Secure contact verification is being configured."; return; }
    widget.hidden = false;
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () => {
      widgetId = window.turnstile.render(widget, {
        sitekey: config.turnstileSiteKey,
        callback: (token) => { turnstileToken = token; status.textContent = "Verification complete."; },
        "expired-callback": () => { turnstileToken = ""; status.textContent = "Verification expired. Please complete it again."; },
        "error-callback": () => { turnstileToken = ""; status.textContent = "Verification could not load. Please refresh and try again."; }
      });
    };
    script.onerror = () => { status.textContent = "Secure verification could not load. Please refresh and try again."; };
    document.head.appendChild(script);
  }

  function value(selector) { return document.querySelector(selector).value.trim(); }
})();
