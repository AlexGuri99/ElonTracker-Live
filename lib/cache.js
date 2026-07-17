// ─── Cache abstraction: Map in dev, Upstash Redis in production ───

const isDev = process.env.NODE_ENV === "development";

// ── In-memory cache (always used as primary cache) ──
const memoryCache = new Map();

// ── Production: Upstash Redis (lazy-initialized) ──
let redisPromise = null;
function getRedis() {
  if (!redisPromise && !isDev && process.env.KV_URL) {
    redisPromise = import("@upstash/redis")
      .then(({ Redis }) => new Redis({ url: process.env.KV_URL, token: process.env.KV_REST_API_TOKEN }))
      .catch(() => null);
  }
  return redisPromise;
}

// ── Public API ──
export async function cacheGet(key) {
  const mem = memoryCache.get(key) ?? null;
  if (mem) return mem;

  const redis = await getRedis();
  if (redis) {
    try {
      const val = await redis.get(key);
      if (val) memoryCache.set(key, val);
      return val ?? null;
    } catch {}
  }
  return null;
}

export async function cacheSet(key, entry) {
  memoryCache.set(key, entry);
  const redis = await getRedis();
  if (redis) {
    try {
      await redis.set(key, entry);
    } catch {}
  }
}