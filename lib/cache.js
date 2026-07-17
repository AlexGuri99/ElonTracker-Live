// ─── Cache abstraction: Map in dev, Upstash Redis in production ───

import { Redis } from "@upstash/redis";

const isDev = process.env.NODE_ENV === "development";

// ── In-memory fallback (used in dev, and in prod when Redis is unavailable) ──
const memoryCache = new Map();

// ── Production: Upstash Redis ──
let redis = null;
if (!isDev && process.env.KV_URL) {
  try {
    redis = new Redis({ url: process.env.KV_URL, token: process.env.KV_REST_API_TOKEN });
  } catch {}
}

// ── Public API ──
export async function cacheGet(key) {
  // Check memory first (fast path for both dev and prod)
  const mem = memoryCache.get(key) ?? null;
  if (mem) return mem;

  // Fall back to Redis in production
  if (redis) {
    try {
      const val = await redis.get(key);
      if (val) memoryCache.set(key, val); // warm the memory cache
      return val ?? null;
    } catch {}
  }
  return null;
}

export async function cacheSet(key, entry) {
  memoryCache.set(key, entry);
  if (redis) {
    try {
      await redis.set(key, entry);
    } catch {}
  }
}