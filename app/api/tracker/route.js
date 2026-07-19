// ─── Cache abstraction (Map+disk in dev, Upstash Redis in production) ───
import { cacheGet, cacheSet } from "../../../lib/cache.js";

const CACHE_TTL = 300_000; // 5 minutes
const RATE_LIMIT_BACKOFF = 600_000; // 10 min backoff when we hit 429

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  Referer: "https://polymarket.com/",
  Origin: "https://polymarket.com",
};

const HISTORICAL_VELOCITY = 1.15; // tweets per hour

// ── Event classifiers ────────────────────────────────────
function isStarship(name) {
  return /starship|super heavy/i.test(name);
}

function isFalconOrStarlink(name) {
  return /falcon|starlink/i.test(name);
}

function isTeslaEvent(name, description) {
  const text = `${name} ${description ?? ""}`;
  return /tesla|elon musk|earnings|deliver(i|y)|product launch|gigafactory|cybertruck|roadster|model [s3xy]|semi|optimus|robotaxi|FSD|full self.?driving|autopilot|battery.?day|investor.?day/i.test(text);
}

function isStarlinkEvent(name, description) {
  const text = `${name} ${description ?? ""}`;
  return /starlink|direct.?to.?cell|laser.?link|space.?internet/i.test(text);
}

// ── Impact calculators ───────────────────────────────────
function calculateLaunchImpact(name) {
  const windowHours = 8;
  if (isStarship(name)) {
    const extra = HISTORICAL_VELOCITY * (2.1 - 1) * windowHours;
    return { type: "starship", multiplier: 2.1, extraTweets: Math.round(extra * 100) / 100 };
  }
  if (isFalconOrStarlink(name)) {
    const extra = HISTORICAL_VELOCITY * (1.25 - 1) * windowHours;
    return { type: "falcon", multiplier: 1.25, extraTweets: Math.round(extra * 100) / 100 };
  }
  return null;
}

function calculateTeslaImpact() {
  const windowHours = 4; // tighter window — earnings calls / product drops
  const multiplier = 1.75;
  const extra = HISTORICAL_VELOCITY * (multiplier - 1) * windowHours;
  return { type: "tesla", multiplier, windowHours, extraTweets: Math.round(extra * 100) / 100 };
}

function calculateStarlinkImpact() {
  const windowHours = 8;
  const multiplier = 1.25;
  const extra = HISTORICAL_VELOCITY * (multiplier - 1) * windowHours;
  return { type: "starlink", multiplier, windowHours, extraTweets: Math.round(extra * 100) / 100 };
}

// ── Velocity calibration from historical weeks ────────────
const VELOCITY_CACHE_KEY = "__velocity__";
const VELOCITY_CACHE_TTL = 3_600_000; // 1 hour — velocity doesn't change minute-to-minute
const MAX_CALIBRATION_WEEKS = 4; // look back at most 4 completed weeks

async function calibrateVelocity(trackings) {
  const cached = await cacheGet(VELOCITY_CACHE_KEY);
  if (cached && Date.now() - cached.timestamp < VELOCITY_CACHE_TTL) {
    return cached.velocity;
  }

  const completed = trackings.filter((t) => {
    if (t.isActive) return false;
    if (!t.startDate || !t.endDate) return false;
    const end = new Date(t.endDate).getTime();
    return end < Date.now() && end > 0;
  });

  // Sort by endDate descending (most recent first), take up to MAX
  const recent = completed
    .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())
    .slice(0, MAX_CALIBRATION_WEEKS);

  if (recent.length === 0) {
    cacheSet(VELOCITY_CACHE_KEY, { velocity: null, timestamp: Date.now() });
    return null;
  }

  const results = await Promise.all(
    recent.map((t) => {
      const url = new URL("https://xtracker.polymarket.com/api/users/elonmusk/posts");
      url.searchParams.set("startDate", t.startDate);
      url.searchParams.set("endDate", t.endDate);
      return fetch(url.toString(), {
        headers: BROWSER_HEADERS,
        signal: AbortSignal.timeout(5_000),
      })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);
    }),
  );

  let totalWeight = 0;
  let weightedSum = 0;
  let count = 0;

  results.forEach((data, i) => {
    if (!data) return;
    const postCount = Array.isArray(data)
      ? data.length
      : Array.isArray(data.data)
        ? data.data.length
        : 0;
    if (postCount === 0) return;

    const t = recent[i];
    const durationHours =
      (new Date(t.endDate).getTime() - new Date(t.startDate).getTime()) / (1000 * 60 * 60);
    if (durationHours <= 0) return;

    const velocity = postCount / durationHours;
    // Linear recency weight: most recent = highest weight (i=0 → weight=4, i=3 → weight=1)
    const weight = MAX_CALIBRATION_WEEKS - i;
    weightedSum += velocity * weight;
    totalWeight += weight;
    count++;
  });

  const calibrated = totalWeight > 0 ? weightedSum / totalWeight : null;

  cacheSet(VELOCITY_CACHE_KEY, { velocity: calibrated, timestamp: Date.now() });
  return calibrated;
}

// ── Fetch helpers ────────────────────────────────────────
function extractResults(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  return [];
}

function isInWindow(dateStr, windowStart, windowEnd) {
  const ms = new Date(dateStr).getTime();
  return ms >= windowStart && ms <= windowEnd;
}

// ── Main handler ─────────────────────────────────────────
export async function GET(request) {
  const now = Date.now();
  const { searchParams } = new URL(request.url);
  const selectedTrackingId = searchParams.get("trackingId");
  const cacheKey = selectedTrackingId ?? "__active__";

  const cached = await cacheGet(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return Response.json({
      ...cached.data,
      cached: true,
      cachedAt: new Date(cached.timestamp).toISOString(),
    });
  }

  try {
    // ── 0. Check if we're in a rate-limit backoff period ─────
    const rateLimitMarker = await cacheGet("__rate_limited__");
    var isRateLimited = rateLimitMarker && Date.now() < rateLimitMarker.timestamp;

    // ── 1. Fetch all external data in parallel (skip Space Devs if rate-limited) ──
    const fetchPromises = [
      fetch("https://xtracker.polymarket.com/api/users/elonmusk", {
        headers: BROWSER_HEADERS,
        signal: AbortSignal.timeout(10_000),
      }),
    ];

    if (!isRateLimited) {
      fetchPromises.push(
        fetch("https://ll.thespacedevs.com/2.2.0/launch/upcoming/?search=SpaceX", {
          signal: AbortSignal.timeout(10_000),
        }),
        fetch("https://ll.thespacedevs.com/2.2.0/event/upcoming/?limit=30", {
          signal: AbortSignal.timeout(10_000),
        }),
      );
    }

    const results = await Promise.all(fetchPromises);
    const [userRes, launchesRes, eventsRes] = results.length >= 3
      ? results
      : [results[0], { ok: false, status: 429 }, { ok: false, status: 429 }];

    // If Space Devs is rate-limited, serve stale cache or set a backoff marker
    if (launchesRes.status === 429 || eventsRes.status === 429) {
      const stale = await cacheGet(cacheKey);
      if (stale) {
        // Extend the cache so we don't hammer the API
        cacheSet(cacheKey, { data: stale.data, timestamp: Date.now() - CACHE_TTL + RATE_LIMIT_BACKOFF });
        return Response.json({
          ...stale.data,
          cached: true,
          stale: true,
          cachedAt: new Date(stale.timestamp).toISOString(),
        });
      }
      // No stale cache — set a backoff marker so we don't re-hit the API
      cacheSet("__rate_limited__", { timestamp: Date.now() + RATE_LIMIT_BACKOFF });
      // Override isRateLimited since we just set the marker
      isRateLimited = true;
    }

    
    // ── 2. Parse user / trackings ─────────────────────────────
    const userRaw = await userRes.text();
    let userData;
    try {
      userData = JSON.parse(userRaw);
    } catch {
      throw new Error("Invalid JSON from Polymarket user API");
    }

    const rawTrackings = (() => {
      if (Array.isArray(userData)) return userData;
      if (userData.data && Array.isArray(userData.data.trackings)) return userData.data.trackings;
      if (userData.data && Array.isArray(userData.data)) return userData.data;
      if (userData.trackings && Array.isArray(userData.trackings)) return userData.trackings;
      if (userData.data && typeof userData.data === "object") return [userData.data];
      return [];
    })();

    if (!Array.isArray(rawTrackings) || rawTrackings.length === 0) {
      throw new Error("No tracking data found in API response");
    }

    const trackings = rawTrackings.map((t) => ({
      id: t.id ?? t.tracking_id ?? null,
      title: t.title ?? t.market_title ?? "Elon Musk Tweet Count",
      startDate: t.startDate ?? t.start_date ?? t.start ?? null,
      endDate: t.endDate ?? t.end_date ?? t.end ?? null,
      isActive: t.isActive ?? t.is_active ?? false,
      targetValue: t.targetValue ?? t.target_value ?? t.target ?? null,
      marketLink: t.marketLink ?? null,
    }));

    // ── 2a. Kick off velocity calibration (runs in parallel with steps 3-6) ──
    const velocityPromise = calibrateVelocity(trackings);

    const selected = selectedTrackingId
      ? trackings.find((t) => String(t.id) === String(selectedTrackingId))
      : null;

    const active = selected ?? trackings.find((t) => t.isActive === true) ?? trackings[0];

    if (!active) {
      throw new Error("No active tracking found in response");
    }

    const { startDate, endDate, title, marketLink } = active;

    if (!startDate || !endDate) {
      throw new Error("Tracking missing dates");
    }

    const activeStart = new Date(startDate).getTime();
    const activeEnd = new Date(endDate).getTime();

    // ── 3. Fetch post count ──────────────────────────────────
    const postsUrl = new URL("https://xtracker.polymarket.com/api/users/elonmusk/posts");
    postsUrl.searchParams.set("startDate", startDate);
    postsUrl.searchParams.set("endDate", endDate);

    const postsRes = await fetch(postsUrl.toString(), {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(10_000),
    });

    let currentCount = 0;
    let dailyCounts = {}; // date string -> cumulative count
    if (postsRes.ok) {
      const postsRaw = await postsRes.text();
      try {
        const postsData = JSON.parse(postsRaw);
        const posts = Array.isArray(postsData) ? postsData : Array.isArray(postsData.data) ? postsData.data : [];
        currentCount = posts.length;

        // Build cumulative counts per day from post timestamps
        if (posts.length > 0) {
          // Sort posts by createdAt ascending
          const sorted = [...posts]
            .filter(p => p.createdAt)
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

          let running = 0;
          let lastDate = "";
          for (const post of sorted) {
            running++;
            const day = new Date(post.createdAt).toISOString().slice(0, 10);
            if (day !== lastDate) {
              dailyCounts[day] = running;
              lastDate = day;
            }
          }
          // Backfill any days between the last post and today
          const lastPostDay = new Date(sorted[sorted.length - 1].createdAt).toISOString().slice(0, 10);
          const todayKey = new Date().toISOString().slice(0, 10);
          let fillDay = new Date(lastPostDay);
          while (fillDay.toISOString().slice(0, 10) < todayKey) {
            fillDay = new Date(fillDay.getTime() + 24 * 60 * 60 * 1000);
            const dayKey = fillDay.toISOString().slice(0, 10);
            if (!(dayKey in dailyCounts)) {
              dailyCounts[dayKey] = currentCount;
            }
          }
          dailyCounts[todayKey] = currentCount;
        }
      } catch {
        console.error("Invalid JSON from posts API");
      }
    }

    // ── 4. Process SpaceX launches ────────────────────────────
    let launchesData = { results: [] };
    if (launchesRes.ok) {
      try {
        launchesData = await launchesRes.json();
      } catch {
        console.error("Invalid JSON from launches API");
      }
    }

    const launchResults = extractResults(launchesData).filter((l) =>
      isInWindow(l.net, activeStart, activeEnd),
    );

    // ── 5. Process Tesla & Starlink events from events API ────
    let eventsData = { results: [] };
    if (eventsRes.ok) {
      try {
        eventsData = await eventsRes.json();
      } catch {
        console.error("Invalid JSON from events API");
      }
    }

    const allEvents = extractResults(eventsData).filter((e) =>
      isInWindow(e.date, activeStart, activeEnd),
    );

    const teslaResults = allEvents.filter(
      (e) => isTeslaEvent(e.name, e.description),
    );

    const starlinkResults = allEvents.filter(
      (e) => isStarlinkEvent(e.name, e.description),
    );

    // ── 6. Build unified events timeline ──────────────────────
    const events = [];
    let totalExtraTweets = 0;

    // SpaceX launches
    for (const launch of launchResults) {
      const name = launch.name ?? "Unknown Launch";
      const impact = calculateLaunchImpact(name);
      if (impact) {
        const launchMs = new Date(launch.net).getTime();
        const windowMs = impact.type === "starship" ? 8 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000;
        events.push({
          name,
          provider: launch.provider?.name ?? launch.launch_service_provider?.abbrev ?? "SpaceX",
          launchDate: launch.net,
          type: impact.type,
          multiplier: impact.multiplier,
          extraTweets: impact.extraTweets,
          windowStart: new Date(launchMs - windowMs / 2).toISOString(),
          windowEnd: new Date(launchMs + windowMs / 2).toISOString(),
        });
        totalExtraTweets += impact.extraTweets;
      }
    }

    // Tesla events
    for (const event of teslaResults) {
      const impact = calculateTeslaImpact();
      const eventMs = new Date(event.date).getTime();
      const windowMs = impact.windowHours * 60 * 60 * 1000;
      events.push({
        name: event.name,
        provider: "Tesla",
        launchDate: event.date,
        type: "tesla",
        multiplier: impact.multiplier,
        extraTweets: impact.extraTweets,
        windowStart: new Date(eventMs - windowMs / 2).toISOString(),
        windowEnd: new Date(eventMs + windowMs / 2).toISOString(),
      });
      totalExtraTweets += impact.extraTweets;
    }

    // Starlink events
    for (const event of starlinkResults) {
      const impact = calculateStarlinkImpact();
      const eventMs = new Date(event.date).getTime();
      const windowMs = impact.windowHours * 60 * 60 * 1000;
      events.push({
        name: event.name,
        provider: "Starlink",
        launchDate: event.date,
        type: "starlink",
        multiplier: impact.multiplier,
        extraTweets: impact.extraTweets,
        windowStart: new Date(eventMs - windowMs / 2).toISOString(),
        windowEnd: new Date(eventMs + windowMs / 2).toISOString(),
      });
      totalExtraTweets += impact.extraTweets;
    }

    // Sort by date ascending
    events.sort((a, b) => new Date(a.launchDate).getTime() - new Date(b.launchDate).getTime());

    // ── 7. Prediction math (with calibrated velocity) ─────────
    const calibratedVelocity = await velocityPromise;
    const velocity = calibratedVelocity ?? HISTORICAL_VELOCITY;
    const velocitySource = calibratedVelocity ? "calibrated" : "default";

    const remainingMs = activeEnd - now;
    const remainingHours = Math.max(0, remainingMs / (1000 * 60 * 60));
    const baselineProjection = currentCount + velocity * remainingHours;
    const eventAdjustedProjection = baselineProjection + totalExtraTweets;

    // ── 8. Chart data (daily points for the full window) ──────
    const chartData = [];
    const totalDays = Math.ceil((activeEnd - activeStart) / (24 * 60 * 60 * 1000));
    let prevActual = null;

    for (let i = 0; i <= totalDays; i++) {
      const pointDate = new Date(activeStart + i * 24 * 60 * 60 * 1000);
      const pointMs = pointDate.getTime();
      const hoursFromStart = i * 24;
      const cumulativeBaseline = hoursFromStart * velocity;

      // Sum catalyst impacts whose event date is <= this point
      let cumulativeCatalyst = 0;
      for (const ev of events) {
        if (new Date(ev.launchDate).getTime() <= pointMs) {
          cumulativeCatalyst += ev.extraTweets;
        }
      }

      const dateKey = pointDate.toISOString().slice(0, 10);
      const todayKey = new Date().toISOString().slice(0, 10);
      // Use the cumulative count at this day, or currentCount for today, or null for future
      let actual = null;
      if (dateKey <= todayKey) {
        actual = dailyCounts[dateKey] ?? (dateKey === todayKey ? currentCount : null);
      }
      const dailyChange = actual !== null && prevActual !== null ? actual - prevActual : null;
      chartData.push({
        date: dateKey,
        actual,
        dailyChange,
        baseline: Math.round(cumulativeBaseline * 100) / 100,
        eventAdjusted: Math.round((cumulativeBaseline + cumulativeCatalyst) * 100) / 100,
      });
      if (actual !== null) prevActual = actual;
    }

    // ── 8. Build response ─────────────────────────────────────
    const result = {
      market: {
        id: active.id,
        title,
        startDate,
        endDate,
        isActive: active.isActive,
        marketLink,
      },
      currentCount,
      projections: {
        baseline: Math.round(baselineProjection * 100) / 100,
        eventAdjusted: Math.round(eventAdjustedProjection * 100) / 100,
        remainingHours: Math.round(remainingHours * 100) / 100,
        historicalVelocity: Math.round(velocity * 100) / 100,
        velocitySource,
        totalExtraTweets: Math.round(totalExtraTweets * 100) / 100,
      },
      events,
      chartData,
      availableTrackings: trackings.map((t) => ({
        id: t.id,
        title: t.title,
        startDate: t.startDate,
        endDate: t.endDate,
        isActive: t.isActive,
        targetValue: t.targetValue,
        marketLink: t.marketLink,
      })),
      cached: false,
      cachedAt: new Date().toISOString(),
    };

    if (!isRateLimited) {
      cacheSet(cacheKey, { data: result, timestamp: Date.now() });
    }
    return Response.json(result);
  } catch (error) {
    console.error("/api/tracker error:", error.message);

    const stale = await cacheGet(cacheKey);
    if (stale) {
      return Response.json({
        ...stale.data,
        cached: true,
        stale: true,
        cachedAt: new Date(stale.timestamp).toISOString(),
      });
    }

    return Response.json(
      { error: "Failed to fetch tracker data", detail: error.message },
      { status: 502 },
    );
  }
}