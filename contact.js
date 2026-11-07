/* Contact form. Two modes:
   - secure: delivered to the Supabase inbox through the contact-submit Edge Function (needs Supabase + Turnstile).
   - compose: no backend configured, so the form drafts an email and opens it in the visitor's mail app. */
(function () {
  const form = document.querySelector("#contactForm");
  const status = document.querySelector("#contactStatus");
  const widget = document.querySelector("#turnstileWidget");
  const button = form?.querySelector('button[type="submit"]');
  const config = window.PORTFOLIO_SITE || {};
  const content = window.PORTFOLIO_CONTENT || {};
  const store = window.PortfolioStore;
  let turnstileToken = "";
  let widgetId = null;
  if (!form) return;

  const secure = Boolean(store && store.hasSupabaseConfig() && config.turnstileSiteKey);
  const inbox = (content.contact || {}).email || config.contactEmail || "";
  if (!secure && !inbox) return;

  form.hidden = false;
  if (secure) setupTurnstile();
  else enableCompose();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (document.querySelector("#contactWebsite").value) return;
    if (!secure) { compose(); return; }
    if (!turnstileToken) { status.textContent = "Please complete the verification before sending your message."; return; }
    button.disabled = true;
    status.textContent = "Sending secure message...";
    try {
      await store.submitMessage({ name: value("#contactName"), email: value("#contactEmail"), subject: value("#contactSubject"), message: value("#contactMessage"), turnstileToken });
      form.reset();
      turnstileToken = "";
      if (widgetId !== null && window.turnstile) window.turnstile.reset(widgetId);
      status.textContent = "Message received. I’ll get back to you soon.";
    } catch (error) { status.textContent = error.message || "Could not send the message."; }
    finally { button.disabled = false; }
  });

  function enableCompose() {
    form.classList.add("is-compose");
    form.querySelectorAll("[data-secure-only]").forEach((node) => { node.hidden = true; });
    form.querySelectorAll("[data-compose-only]").forEach((node) => { node.hidden = false; });
    const email = document.querySelector("#contactEmail");
    if (email) email.required = false;
    const label = form.querySelector("[data-submit-label]");
    if (label) label.textContent = "Open in Email App";
  }

  function compose() {
    const name = value("#contactName");
    const message = value("#contactMessage");
    if (!name || !message) { status.textContent = "Please add your name and a message."; return; }
    const topic = form.querySelector('input[name="contactTopic"]:checked')?.value || "Portfolio inquiry";
    const subject = `${topic} — from ${name}`;
    const body = `${message}\n\n— ${name}`;
    window.location.href = `mailto:${inbox}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    status.textContent = `Your email app should open with the message ready. If it doesn't, email ${inbox} directly.`;
  }

  function setupTurnstile() {
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
