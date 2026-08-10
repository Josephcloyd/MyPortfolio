const responseHeaders = { "Content-Type": "application/json" };

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const expected = Deno.env.get("CONTACT_WEBHOOK_SECRET");
  const received = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!expected || received !== expected) return new Response("Unauthorized", { status: 401 });

  const payload = await request.json();
  const message = payload.record;
  if (!message?.email || !message?.message) return new Response("Invalid payload", { status: 400 });

  const apiKey = Deno.env.get("RESEND_API_KEY");
  const to = Deno.env.get("CONTACT_TO_EMAIL");
  if (!apiKey || !to) return new Response("Missing email configuration", { status: 500 });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Portfolio <onboarding@resend.dev>",
      to: [to],
      reply_to: message.email,
      subject: `Portfolio inquiry: ${message.subject || "New message"}`,
      text: `From: ${message.name} <${message.email}>\n\n${message.message}`
    })
  });

  return new Response(JSON.stringify(await response.json()), { status: response.status, headers: responseHeaders });
});
