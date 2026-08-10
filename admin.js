(async function () {
  const store = window.PortfolioStore;
  const form = document.querySelector("#itemForm");
  const list = document.querySelector("#adminList");
  const messageList = document.querySelector("#messageList");
  const storageMode = document.querySelector("#storageMode");
  const authStatus = document.querySelector("#authStatus");
  const signOutButton = document.querySelector("#signOutButton");
  const seedButton = document.querySelector("#seedButton");
  const resetButton = document.querySelector("#resetFormButton");
  const formTitle = document.querySelector("#formTitle");
  const gate = document.querySelector("#authGate");
  const shell = document.querySelector("#adminShell");
  const gateForm = document.querySelector("#gateLoginForm");
  const gateStatus = document.querySelector("#gateStatus");
  const search = document.querySelector("#recordSearch");
  const filter = document.querySelector("#recordFilter");
  let items = [];
  let messages = [];
  let draggedId = null;
  if (!store || !form || !list) return;

  const canContinue = await initAuth();
  wireEditor();
  updatePreview();
  if (canContinue) await refresh();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    try { await store.saveItem(formToItem()); notify(store.hasSupabaseConfig() ? "Saved to Supabase." : "Saved in local preview mode."); clearForm(); await refresh(); }
    catch (error) { notify(error.message || "Could not save this item.", true); }
  });
  resetButton.addEventListener("click", clearForm);
  seedButton.addEventListener("click", async () => { try { await store.seedStarterItems(); notify("Starter content imported."); await refresh(); } catch (error) { notify(error.message, true); } });
  search.addEventListener("input", renderFilteredList);
  filter.addEventListener("change", renderFilteredList);

  document.querySelector("#uploadButton").addEventListener("click", async () => {
    const file = document.querySelector("#mediaFile").files[0];
    try { notify("Uploading image..."); const url = await store.uploadMedia(file); setValue("#itemImageUrl", url); updatePreview(); notify(store.hasSupabaseConfig() ? "Image uploaded to Supabase Storage." : "Image attached to this local draft."); }
    catch (error) { notify(error.message, true); }
  });

  document.querySelector("#appendGalleryButton").addEventListener("click", async () => {
    const file = document.querySelector("#mediaFile").files[0];
    try {
      notify("Uploading gallery image...");
      const url = await store.uploadMedia(file);
      const current = value("#itemGalleryUrls");
      setValue("#itemGalleryUrls", [current, url].filter(Boolean).join("\n"));
      updatePreview();
      notify("Gallery image added to this record.");
    } catch (error) { notify(error.message, true); }
  });

  list.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const itemValue = items.find((entry) => entry.id === button.dataset.id);
    if (button.dataset.action === "edit" && itemValue) fillForm(itemValue);
    if (button.dataset.action === "duplicate" && itemValue) { const copy = { ...itemValue, id: undefined, title: `${itemValue.title} Copy`, published: false, sort_order: Number(itemValue.sort_order) + 1 }; await store.saveItem(copy); notify("Draft duplicate created."); await refresh(); }
    if (button.dataset.action === "delete" && confirm("Delete this portfolio item?")) { try { await store.deleteItem(button.dataset.id); notify("Record deleted."); await refresh(); } catch (error) { notify(error.message, true); } }
  });

  list.addEventListener("dragstart", (event) => { const card = event.target.closest("[data-record-id]"); if (card) { draggedId = card.dataset.recordId; card.classList.add("is-dragging"); } });
  list.addEventListener("dragend", (event) => { event.target.closest("[data-record-id]")?.classList.remove("is-dragging"); draggedId = null; });
  list.addEventListener("dragover", (event) => event.preventDefault());
  list.addEventListener("drop", async (event) => {
    event.preventDefault();
    const target = event.target.closest("[data-record-id]");
    if (!target || !draggedId || target.dataset.recordId === draggedId) return;
    const from = items.findIndex((entry) => entry.id === draggedId);
    const to = items.findIndex((entry) => entry.id === target.dataset.recordId);
    const [moved] = items.splice(from, 1); items.splice(to, 0, moved);
    try { await Promise.all(items.map((entry, index) => store.saveItem({ ...entry, sort_order: (index + 1) * 10 }))); notify("Display order updated."); await refresh(); } catch (error) { notify(error.message, true); }
  });

  messageList.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-message-action]");
    if (!button) return;
    try {
      if (button.dataset.messageAction === "read") await store.setMessageStatus(button.dataset.id, "read");
      if (button.dataset.messageAction === "archive") await store.setMessageStatus(button.dataset.id, "archived");
      if (button.dataset.messageAction === "delete" && confirm("Delete this message?")) await store.deleteMessage(button.dataset.id);
      await refreshMessages();
    } catch (error) { notify(error.message, true); }
  });

  async function initAuth() {
    const sb = store.client();
    if (!sb) { storageMode.textContent = "Local draft mode"; authStatus.textContent = "Changes and messages stay in this browser until Supabase is connected."; document.body.classList.remove("auth-pending"); return true; }
    storageMode.textContent = "Supabase connected";
    gateForm.addEventListener("submit", handleLogin);
    signOutButton.addEventListener("click", async () => { await sb.auth.signOut(); lockAdmin(); });
    const { data } = await sb.auth.getUser();
    if (!data.user) { lockAdmin(); return false; }
    unlockAdmin(data.user);
    return true;
  }

  async function handleLogin(event) {
    event.preventDefault();
    gateStatus.textContent = "Checking credentials...";
    const { data, error } = await store.client().auth.signInWithPassword({ email: value("#gateEmail"), password: value("#gatePassword") });
    if (error) { gateStatus.textContent = error.message; return; }
    unlockAdmin(data.user); gateForm.reset(); await refresh(); wireEditor(); updatePreview();
  }

  function lockAdmin() { shell.hidden = true; gate.hidden = false; document.body.classList.remove("auth-pending"); document.body.classList.add("is-auth-locked"); }
  function unlockAdmin(user) { shell.hidden = false; gate.hidden = true; document.body.classList.remove("auth-pending", "is-auth-locked"); signOutButton.hidden = false; authStatus.textContent = `Signed in as ${user.email}. Writes, uploads, and inbox access are protected.`; }

  function wireEditor() {
    if (form.dataset.wired) return;
    form.dataset.wired = "true";
    form.addEventListener("input", updatePreview);
    document.querySelector("#itemType").addEventListener("change", toggleCaseFields);
    toggleCaseFields();
  }

  async function refresh() { items = await store.loadItems({ includeDrafts: true }); renderFilteredList(); await refreshMessages(); }
  async function refreshMessages() { try { messages = await store.loadMessages(); renderMessages(); } catch (error) { messageList.innerHTML = `<article class="empty-message"><p>Inbox is available after an authenticated Supabase connection.</p></article>`; } }

  function renderFilteredList() {
    const query = search.value.trim().toLowerCase();
    const type = filter.value;
    const collection = items.filter((entry) => (type === "all" || entry.type === type) && (!query || `${entry.title} ${entry.category} ${entry.tags.join(" ")}`.toLowerCase().includes(query)));
    if (!collection.length) { list.innerHTML = `<article class="admin-item"><h3>No matching records</h3><p>Adjust the search or create a new item.</p></article>`; return; }
    list.innerHTML = collection.map((entry, index) => `
      <article class="admin-item depth-card" draggable="true" data-record-id="${escapeAttr(entry.id)}"><div><div class="card-readout"><span class="admin-type">${escapeHtml(entry.type)}</span><small>REC-${String(index + 1).padStart(2, "0")}</small></div><h3>${escapeHtml(entry.title)}</h3><p>${escapeHtml(entry.category || entry.subtitle || entry.description)}</p><span class="record-status ${statusClass(entry)}">${statusLabel(entry)}</span><div class="tag-list">${(entry.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div></div><div class="admin-item-actions"><button class="btn btn-outline" type="button" data-action="edit" data-id="${escapeAttr(entry.id)}">Edit</button><button class="btn btn-outline" type="button" data-action="duplicate" data-id="${escapeAttr(entry.id)}">Duplicate</button><button class="btn btn-danger" type="button" data-action="delete" data-id="${escapeAttr(entry.id)}">Delete</button></div></article>`).join("");
  }

  function renderMessages() {
    if (!messages.length) { messageList.innerHTML = `<article class="empty-message"><p>No messages yet.</p></article>`; return; }
    messageList.innerHTML = messages.map((message) => `<article class="message-item ${message.status === "new" ? "is-new" : ""}"><div class="card-readout"><span>${escapeHtml(message.status || "new")}</span><small>${formatDate(message.created_at)}</small></div><h3>${escapeHtml(message.subject || "Portfolio inquiry")}</h3><p>${escapeHtml(message.message)}</p><div class="message-sender"><strong>${escapeHtml(message.name)}</strong><a href="mailto:${escapeAttr(message.email)}">${escapeHtml(message.email)}</a></div><div class="admin-item-actions"><button class="btn btn-outline" data-message-action="read" data-id="${escapeAttr(message.id)}">Read</button><button class="btn btn-outline" data-message-action="archive" data-id="${escapeAttr(message.id)}">Archive</button><button class="btn btn-danger" data-message-action="delete" data-id="${escapeAttr(message.id)}">Delete</button></div></article>`).join("");
  }

  function formToItem() { return store.normalize({ id: value("#itemId") || undefined, type: value("#itemType"), title: value("#itemTitle"), category: value("#itemCategory"), subtitle: value("#itemSubtitle"), description: value("#itemDescription"), tags: value("#itemTags"), url: value("#itemUrl"), image_url: value("#itemImageUrl"), gallery_urls: lines("#itemGalleryUrls"), role: value("#itemRole"), stack_summary: value("#itemStackSummary"), challenge: value("#itemChallenge"), solution: value("#itemSolution"), outcome: value("#itemOutcome"), learnings: value("#itemLearnings"), next_steps: value("#itemNextSteps"), publish_at: value("#itemPublishAt") ? new Date(value("#itemPublishAt")).toISOString() : null, sort_order: Number(value("#itemSort") || 0), featured: checked("#itemFeatured"), published: checked("#itemPublished") }); }
  function fillForm(entry) { setValue("#itemId", entry.id); setValue("#itemType", entry.type); setValue("#itemTitle", entry.title); setValue("#itemCategory", entry.category); setValue("#itemSubtitle", entry.subtitle); setValue("#itemDescription", entry.description); setValue("#itemTags", (entry.tags || []).join(", ")); setValue("#itemUrl", entry.url); setValue("#itemImageUrl", entry.image_url); setValue("#itemGalleryUrls", (entry.gallery_urls || []).join("\n")); setValue("#itemRole", entry.role); setValue("#itemStackSummary", entry.stack_summary); setValue("#itemChallenge", entry.challenge); setValue("#itemSolution", entry.solution); setValue("#itemOutcome", entry.outcome); setValue("#itemLearnings", entry.learnings); setValue("#itemNextSteps", entry.next_steps); setValue("#itemPublishAt", toLocalDate(entry.publish_at)); setValue("#itemSort", entry.sort_order); setChecked("#itemFeatured", entry.featured); setChecked("#itemPublished", entry.published); formTitle.textContent = "Edit Portfolio Item"; toggleCaseFields(); updatePreview(); form.scrollIntoView({ behavior: "smooth", block: "start" }); }
  function clearForm() { form.reset(); setValue("#itemId", ""); setValue("#itemSort", "0"); setValue("#itemGalleryUrls", ""); setChecked("#itemPublished", true); formTitle.textContent = "Add Portfolio Item"; toggleCaseFields(); updatePreview(); }
  function toggleCaseFields() { document.querySelector("#caseFields").hidden = value("#itemType") !== "project"; }
  function updatePreview() { const root = document.querySelector("#editorPreview"); const title = value("#itemTitle") || "Untitled record"; const category = value("#itemCategory") || value("#itemType") || "Record"; const description = value("#itemDescription") || "Your description will appear here."; const imageUrl = value("#itemImageUrl"); const galleryCount = lines("#itemGalleryUrls").length; root.innerHTML = `${imageUrl ? `<img src="${escapeAttr(imageUrl)}" alt="" />` : `<div class="preview-signal"><i></i><i></i><i></i></div>`}<div class="card-readout"><span>${escapeHtml(category)}</span><small>${galleryCount ? `${galleryCount} MEDIA` : "PREVIEW"}</small></div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(description)}</p>`; }
  function notify(message, isError) { authStatus.textContent = message || "Something went wrong."; authStatus.classList.toggle("is-error", Boolean(isError)); }
  function statusLabel(entry) { if (!entry.published) return "Draft"; if (entry.publish_at && new Date(entry.publish_at) > new Date()) return "Scheduled"; return "Published"; }
  function statusClass(entry) { return statusLabel(entry) === "Published" ? "is-live" : statusLabel(entry) === "Scheduled" ? "is-scheduled" : "is-draft"; }
  function formatDate(value) { return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
  function toLocalDate(value) { if (!value) return ""; const date = new Date(value); const offset = date.getTimezoneOffset() * 60000; return new Date(date - offset).toISOString().slice(0, 16); }
  function value(selector) { return document.querySelector(selector).value.trim(); }
  function lines(selector) { return value(selector).split(/\r?\n|,/).map((entry) => entry.trim()).filter(Boolean); }
  function setValue(selector, valueToSet) { document.querySelector(selector).value = valueToSet || ""; }
  function checked(selector) { return document.querySelector(selector).checked; }
  function setChecked(selector, valueToSet) { document.querySelector(selector).checked = Boolean(valueToSet); }
  function escapeHtml(valueToEscape) { return String(valueToEscape || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
  function escapeAttr(valueToEscape) { return escapeHtml(valueToEscape).replaceAll("`", "&#096;"); }
})();
