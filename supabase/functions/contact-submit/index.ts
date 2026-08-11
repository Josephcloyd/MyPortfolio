import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.2";

const jsonHeaders = { "Content-Type": "application/json" };

Deno.serve(async (request) => {
  const origin = request.headers.get("origin") || "";
  const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") || "").split(",").map((value) => value.trim()).filter(Boolean);
  const corsHeaders = { ...jsonHeaders, "Access-Control-Allow-Origin": origin, "Vary": "Origin" };

  if (!allowedOrigins.includes(origin)) return respond({ error: "Origin is not allowed." }, 403, jsonHeaders);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { ...corsHeaders, "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" } });
  if (request.method !== "POST") return respond({ error: "Method not allowed." }, 405, corsHeaders);

  const body = await request.json().catch(() => null);
  const name = text(body?.name, 120);
  const email = text(body?.email, 240).toLowerCase();
  const subject = text(body?.subject, 180);
  const message = text(body?.message, 5000);
  const token = text(body?.turnstileToken, 2048);
  if (!name || !email || !message || !isEmail(email) || !token) return respond({ error: "Please complete every required field and verification." }, 400, corsHeaders);

  const turnstileSecret = Deno.env.get("TURNSTILE_SECRET_KEY");
  const expectedHosts = new Set((Deno.env.get("TURNSTILE_HOSTNAMES") || "").split(",").map((value) => value.trim()).filter(Boolean));
  if (!turnstileSecret || !expectedHosts.size) return respond({ error: "Contact security is not configured yet." }, 503, corsHeaders);

  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const verification = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret: turnstileSecret, response: token, remoteip: ip })
  });
  const result = await verification.json();
  if (!result.success || !expectedHosts.has(result.hostname)) return respond({ error: "Verification expired. Please try again." }, 403, corsHeaders);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const rateLimitSalt = Deno.env.get("CONTACT_RATE_LIMIT_SALT");
  if (!supabaseUrl || !serviceKey || !rateLimitSalt) return respond({ error: "Contact service is not configured yet." }, 503, corsHeaders);

  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const fingerprint = await sha256(`${ip}:${rateLimitSalt}`);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await db.from("contact_rate_limits").select("id", { count: "exact", head: true }).eq("fingerprint", fingerprint).gte("created_at", oneHourAgo);
  if (countError) return respond({ error: "Could not verify the request limit." }, 500, corsHeaders);
  if ((count || 0) >= 5) return respond({ error: "Too many messages from this connection. Please try again later." }, 429, corsHeaders);

  const { error: rateError } = await db.from("contact_rate_limits").insert({ fingerprint });
  if (rateError) return respond({ error: "Could not record the request." }, 500, corsHeaders);
  const { error: messageError } = await db.from("contact_messages").insert({ name, email, subject, message });
  if (messageError) return respond({ error: "Could not send your message." }, 500, corsHeaders);

  return respond({ ok: true }, 200, corsHeaders);
});

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function respond(body: Record<string, unknown>, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), { status, headers });
}
