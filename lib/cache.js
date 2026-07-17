// ─── Cache abstraction: Map in dev, Upstash Redis REST API in production ───

const isDev = process.env.NODE_ENV === "development";

// ── In-memory cache (always used as primary cache) ──
const memoryCache = new Map();

// ── Production: Upstash Redis via REST API (no package needed) ──
const KV_URL = !isDev ? process.env.KV_REST_API_URL ?? process.env.KV_URL : null;
const KV_TOKEN = !isDev ? process.env.KV_REST_API_TOKEN : null;
// Strip protocol if present — REST API needs raw hostname
const KV_HOST = KV_URL ? KV_URL.replace(/^https?:\/\//, "") : null;

async function redisGet(key) {
  if (!KV_HOST || !KV_TOKEN) return null;
  try {
    const res = await fetch(`https://${KV_HOST}/get/${key}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
      signal: AbortSignal.timeout(3_000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.result ?? null;
  } catch {
    return null;
  }
}

async function redisSet(key, value) {
  if (!KV_HOST || !KV_TOKEN) return;
  try {
    await fetch(`https://${KV_HOST}/set/${key}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${KV_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(value),
      signal: AbortSignal.timeout(3_000),
    });
  } catch {}
}

// ── Public API ──
export async function cacheGet(key) {
  const mem = memoryCache.get(key) ?? null;
  if (mem) return mem;

  const val = await redisGet(key);
  if (val) memoryCache.set(key, val);
  return val ?? null;
}

export async function cacheSet(key, entry) {
  memoryCache.set(key, entry);
  redisSet(key, entry); // fire-and-forget, don't block
}