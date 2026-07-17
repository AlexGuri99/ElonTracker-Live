// ─── Cache abstraction: Map+disk in dev, Upstash Redis in production ───

import fs from "fs";
import path from "path";

const isDev = process.env.NODE_ENV === "development";

// ── Dev: in-memory Map + disk persistence ──
const memoryCache = new Map();
const CACHE_DIR = process.cwd() + "/.cache";

function loadDiskCache() {
  try {
    if (!fs.existsSync(CACHE_DIR)) return;
    const files = fs.readdirSync(CACHE_DIR);
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const key = file.slice(0, -5);
      const raw = fs.readFileSync(path.join(CACHE_DIR, file), "utf-8");
      const entry = JSON.parse(raw);
      memoryCache.set(key, entry);
    }
  } catch {}
}
loadDiskCache();

function saveToDisk(key, entry) {
  try {
    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
    const safeKey = String(key).replace(/[^a-zA-Z0-9_-]/g, "_");
    fs.writeFileSync(path.join(CACHE_DIR, `${safeKey}.json`), JSON.stringify(entry), "utf-8");
  } catch {}
}

// ── Production: Upstash Redis (lazily initialized) ──
let redisPromise = null;
function getRedis() {
  if (!redisPromise && !isDev && process.env.KV_URL) {
    redisPromise = import("@upstash/redis").then(
      ({ Redis }) => new Redis({ url: process.env.KV_URL, token: process.env.KV_REST_API_TOKEN }),
    );
  }
  return redisPromise ?? null;
}

// ── Public API ──
export async function cacheGet(key) {
  if (isDev) {
    return memoryCache.get(key) ?? null;
  }
  const redis = await getRedis();
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
    saveToDisk(key, entry);
  }
  const redis = await getRedis();
  if (redis) {
    try {
      await redis.set(key, entry);
    } catch {}
  }
}