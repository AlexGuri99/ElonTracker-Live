// ─── Cache abstraction: Map in dev, Upstash Redis in production ───

import { Redis } from "@upstash/redis";

const isDev = process.env.NODE_ENV === "development";

// ── Dev: in-memory Map ──
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
  if (isDev) {
    return memoryCache.get(key) ?? null;
  }
  if (redis) {
    try {
      return await redis.get(key);
    } catch {}
  }
  return null;
}

export async function cacheSet(key, entry) {
  if (isDev) {
    memoryCache.set(key, entry);
  }
  if (redis) {
    try {
      await redis.set(key, entry);
    } catch {}
  }
}