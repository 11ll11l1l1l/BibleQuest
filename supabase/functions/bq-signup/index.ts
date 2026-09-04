import { createClient } from "npm:@supabase/supabase-js@2.112.4";

const ALLOWED_ORIGINS = new Set(["https://11ll11l1l1l.github.io"]);
const json = (body: unknown, status = 200, origin = "https://11ll11l1l1l.github.io") => new Response(JSON.stringify(body), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": origin,
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
    "access-control-allow-methods": "POST, OPTIONS",
    "vary": "Origin",
  },
});
const text = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 254;

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") || "";
  const corsOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "https://11ll11l1l1l.github.io";
  if (req.method === "OPTIONS") return json({ ok: true }, 200, corsOrigin);
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, corsOrigin);
  if (!ALLOWED_ORIGINS.has(origin)) return json({ error: "Registration must start from BibleQuest." }, 403, corsOrigin);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return json({ error: "Registration service is unavailable." }, 503, corsOrigin);
  const admin = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "Invalid registration request." }, 400, corsOrigin); }

  const full_name = text(body.full_name, 120);
  const preferred_name = text(body.preferred_name, 40);
  const church_group = text(body.church_group, 120);
  const email = text(body.email, 254).toLowerCase();
  const password = String(body.password ?? "");
  const avatar = (body.avatar && typeof body.avatar === "object") ? body.avatar : {};
  if (full_name.length < 2 || preferred_name.length < 2) return json({ error: "Please enter your name and preferred name." }, 400, corsOrigin);
  if (!emailOk(email)) return json({ error: "Please enter a valid email address." }, 400, corsOrigin);
  if (password.length < 8 || password.length > 128) return json({ error: "Password must be 8–128 characters." }, 400, corsOrigin);

  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("cf-connecting-ip") || "unknown";
  const ipHash = await sha256(`biblequest-signup-v1:${forwarded}`);
  const bucket = new Date(); bucket.setUTCMinutes(0, 0, 0);
  const window_start = bucket.toISOString();
  const { data: limitRow } = await admin.from("bible_signup_limits").select("attempts").eq("ip_hash", ipHash).eq("window_start", window_start).maybeSingle();
  const attempts = Number(limitRow?.attempts || 0);
  if (attempts >= 8) return json({ error: "Too many registration attempts from this network. Please try again later." }, 429, corsOrigin);
  await admin.from("bible_signup_limits").upsert({ ip_hash: ipHash, window_start, attempts: attempts + 1, updated_at: new Date().toISOString() }, { onConflict: "ip_hash,window_start" });

  const metadata = { full_name, preferred_name, church_group, avatar, onboarding_complete: true };
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: metadata });
  if (created.error || !created.data.user) {
    const msg = /already|registered|exists/i.test(created.error?.message || "")
      ? "This email may already have a BibleQuest account. Try signing in instead."
      : "Could not create the account. Please try again.";
    return json({ error: msg }, 400, corsOrigin);
  }

  const user = created.data.user;
  const now = new Date().toISOString();
  const profile = await admin.from("bible_profiles").upsert({
    user_id: user.id,
    display_name: preferred_name,
    full_name,
    preferred_name,
    church_group: church_group || null,
    avatar,
    onboarding_complete: true,
    last_active_at: now,
    updated_at: now,
  }, { onConflict: "user_id" });
  if (profile.error) {
    await admin.auth.admin.deleteUser(user.id).catch(() => undefined);
    return json({ error: "Account setup could not be completed. Please try again." }, 500, corsOrigin);
  }
  return json({ ok: true }, 201, corsOrigin);
});
