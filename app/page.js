"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Clock,
  Activity,
  Rocket,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  ExternalLink,
  RefreshCw,
  Zap,
  Timer,
  Calculator,
  ArrowRight,
  Info,
  Orbit,
  Satellite,
  Shuffle,
  ChevronDown,
  Plus,
  Minus,
  DollarSign,
  Car,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Utility helpers
// ─────────────────────────────────────────────────────────────

function formatTime(ms) {
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

function formatNumber(n) {
  if (n === null || n === undefined) return "—";
  if (Number.isInteger(n)) return n.toLocaleString();
  return n.toFixed(1);
}

function timeAgo(date) {
  if (!date) return "";
  const diff = Date.now() - date.getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 5) return "just now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

// ─────────────────────────────────────────────────────────────
// Countdown Timer
// ─────────────────────────────────────────────────────────────

function CountdownTimer({ endDate }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!endDate) {
    return (
      <div className="text-slate-500 text-sm">Awaiting contract data...</div>
    );
  }

  const end = new Date(endDate).getTime();
  const remaining = end - now;
  const expired = remaining <= 0;
  const t = formatTime(expired ? 0 : remaining);

  if (expired) {
    return (
      <div className="flex items-center gap-2 text-red-400 text-sm font-medium">
        <Timer size={16} />
        Contract Expired
      </div>
    );
  }

  const cells = [
    { label: "Days", value: t.days },
    { label: "Hours", value: t.hours },
    { label: "Min", value: t.minutes },
    { label: "Sec", value: t.seconds },
  ];

  return (
    <div className="flex items-center gap-1.5">
      <Timer size={16} className="text-emerald-400" />
      {cells.map((c, i) => (
        <span key={c.label} className="flex items-center gap-0.5">
          <span className="tabular-nums font-mono font-bold text-emerald-300 min-w-[2ch] text-center">
            {String(c.value).padStart(2, "0")}
          </span>
          <span className="text-slate-500 text-xs">{c.label}</span>
          {i < cells.length - 1 && (
            <span className="text-slate-600 mx-0.5">:</span>
          )}
        </span>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Metric Card
// ─────────────────────────────────────────────────────────────

function MetricCard({ label, value, icon, accent, subtext, loading, large }) {
  const accentMap = {
    emerald: "text-emerald-400",
    blue: "text-blue-400",
    orange: "text-orange-400",
    purple: "text-purple-400",
  };
  const borderMap = {
    emerald: "border-emerald-500/30",
    blue: "border-blue-500/30",
    orange: "border-orange-500/30",
    purple: "border-purple-500/30",
  };
  const bgMap = {
    emerald: "bg-emerald-500/10",
    blue: "bg-blue-500/10",
    orange: "bg-orange-500/10",
    purple: "bg-purple-500/10",
  };

  const c = accent ?? "emerald";

  return (
    <div
      className={`relative overflow-hidden rounded-xl border ${borderMap[c]} bg-slate-900/60 backdrop-blur-sm p-5 transition-all hover:border-${c === "orange" ? "orange-400/50" : "slate-600/50"} ${large ? "col-span-1 md:col-span-1" : ""}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">
          {label}
        </span>
        <span className={`${accentMap[c]} ${bgMap[c]} p-1.5 rounded-lg`}>
          {icon}
        </span>
      </div>
      {loading ? (
        <div className="h-9 w-32 bg-slate-800 rounded animate-pulse mt-1" />
      ) : (
        <>
          <div className={`font-bold tracking-tight ${large ? "text-4xl md:text-5xl" : "text-3xl md:text-4xl"} ${accentMap[c]}`}>
            {formatNumber(value)}
          </div>
          {subtext && (
            <p className="text-slate-500 text-xs mt-1.5">{subtext}</p>
          )}
        </>
      )}
      {/* subtle glow */}
      <div
        className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full ${bgMap[c]} blur-3xl opacity-20 pointer-events-none`}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Event Card
// ─────────────────────────────────────────────────────────────

function EventCard({ event }) {
  const launchDate = new Date(event.launchDate);

  const typeConfig = {
    starship: { icon: Orbit, bg: "bg-purple-500/10 text-purple-400", badge: "bg-purple-500/15 text-purple-300", label: "Starship" },
    falcon: { icon: Rocket, bg: "bg-blue-500/10 text-blue-400", badge: "bg-blue-500/15 text-blue-300", label: "Falcon" },
    tesla: { icon: Car, bg: "bg-amber-500/10 text-amber-400", badge: "bg-amber-500/15 text-amber-300", label: "Tesla" },
    starlink: { icon: Satellite, bg: "bg-cyan-500/10 text-cyan-400", badge: "bg-cyan-500/15 text-cyan-300", label: "Starlink" },
  };

  const cfg = typeConfig[event.type] ?? typeConfig.falcon;
  const IconComponent = cfg.icon;

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/40 border border-slate-800/50 hover:border-slate-700/50 transition-colors">
      <div className={`p-2 rounded-lg shrink-0 ${cfg.bg}`}>
        <IconComponent size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-slate-200 truncate">
            {event.name}
          </span>
          <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full ${cfg.badge}`}>
            {cfg.label}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
          <span>
            {launchDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span>{event.provider}</span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-sm font-bold text-orange-400">
          +{event.extraTweets}
        </div>
        <div className="text-[10px] text-slate-500">extra tweets</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Loading Skeleton
// ─────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        <div className="h-16 bg-slate-900/60 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-900/60 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-48 bg-slate-900/60 rounded-xl animate-pulse" />
        <div className="h-64 bg-slate-900/60 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Error State
// ─────────────────────────────────────────────────────────────

function ErrorState({ message, onRetry }) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="inline-flex p-3 rounded-full bg-red-500/10 text-red-400">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-200">Connection Error</h2>
        <p className="text-slate-400 text-sm">{message}</p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors"
        >
          <RefreshCw size={14} />
          Retry
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Empty State (no events)
// ─────────────────────────────────────────────────────────────

function EmptyEvents() {
  return (
    <div className="text-center py-8">
      <Rocket size={32} className="mx-auto text-slate-600 mb-2" />
      <p className="text-slate-500 text-sm">No SpaceX launches detected within the contract window</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Week Selector Dropdown
// ─────────────────────────────────────────────────────────────

function WeekSelector({ trackings, selectedId, onSelect, loading }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = trackings?.find((t) => String(t.id) === String(selectedId)) ?? trackings?.[0];

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Shorten a title for display, e.g. "Jul 17 – Jul 24"
  const shortLabel = (t) => {
    if (!t?.startDate) return t?.title ?? "Select week";
    const s = new Date(t.startDate);
    const e = new Date(t.endDate);
    const opts = { month: "short", day: "numeric" };
    return `${s.toLocaleDateString("en-US", opts)} – ${e.toLocaleDateString("en-US", opts)}`;
  };

  if (!trackings || trackings.length === 0) {
    return (
      <div className="h-9 w-48 bg-slate-800 rounded-lg animate-pulse" />
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 text-slate-200 text-sm font-medium transition-colors min-w-[200px] disabled:opacity-50"
      >
        <span className="flex-1 text-left truncate">
          {selected ? shortLabel(selected) : "Select week"}
        </span>
        <ChevronDown
          size={14}
          className={`text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-72 rounded-lg border border-slate-700 bg-slate-900 shadow-xl shadow-black/40 z-50 overflow-hidden">
          <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-800">
            Contract Weeks
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {trackings.map((t) => {
              const isSel = String(t.id) === String(selectedId) || (!selectedId && t.isActive);
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    onSelect(t.id);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${isSel
                      ? "bg-emerald-500/10 text-emerald-300"
                      : "text-slate-300 hover:bg-slate-800/60"
                    }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${isSel ? "border-emerald-400" : "border-slate-600"
                      }`}
                  >
                    {isSel && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block truncate font-medium">{shortLabel(t)}</span>
                    <span className="block text-[11px] text-slate-500 truncate mt-0.5">
                      {t.title}
                    </span>
                  </span>
                  {t.isActive && (
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 shrink-0">
                      Live
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Header Block
// ─────────────────────────────────────────────────────────────

function HeaderBlock({ data, trackings, selectedId, onSelectTracking, lastUpdated, onRefresh, refreshing }) {
  return (
    <div className="relative z-10 rounded-xl border border-slate-800 bg-slate-900/70 backdrop-blur-sm p-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-lg md:text-xl font-bold text-slate-100 truncate">
              {data?.market?.marketLink ? (
                <a
                  href={data.market.marketLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5"
                >
                  {data?.market?.title ?? "ElonTracker Live"}
                  <ExternalLink size={14} className="text-slate-500 shrink-0" />
                </a>
              ) : (
                data?.market?.title ?? "ElonTracker Live"
              )}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
              Live Syncing
            </span>
          </div>
          <div className="flex items-center gap-4 flex-wrap mt-2">
            <WeekSelector
              trackings={trackings}
              selectedId={selectedId}
              onSelect={onSelectTracking}
              loading={false}
            />
            <CountdownTimer endDate={data?.market?.endDate} />
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Clock size={12} />
              Updated {timeAgo(lastUpdated)}
            </div>
          </div>
        </div>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-xs font-medium transition-colors shrink-0"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Hero Metric Grid
// ─────────────────────────────────────────────────────────────

function MetricGrid({ data, loading }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard
        label="Current Tweets"
        value={data?.currentCount}
        icon={<BarChart3 size={16} />}
        accent="emerald"
        loading={loading}
        large
        subtext={
          data?.market?.startDate ? (
            <span className="text-emerald-600 dark:text-emerald-400">
              Since {new Date(data.market.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          ) : ""
        }
      />
      <MetricCard
        label="Baseline Projection"
        value={data?.projections?.baseline}
        icon={<Activity size={16} />}
        accent="blue"
        loading={loading}
        large
        subtext={
          <span className="text-blue-600 dark:text-blue-400">
            {`${data?.projections?.historicalVelocity ?? 1.15} tweets/hr${data?.projections?.velocitySource === "calibrated" ? " (calibrated)" : " (default)"} · ${data?.projections?.remainingHours ?? 0}h remaining`}
          </span>
        }
      />
      <MetricCard
        label="Event-Adjusted Projection"
        value={data?.projections?.eventAdjusted}
        icon={<Zap size={16} />}
        accent="orange"
        loading={loading}
        large
        subtext={
          <span className="text-orange-600 dark:text-orange-400">
            {data?.projections?.totalExtraTweets > 0
              ? `+${data.projections.totalExtraTweets} from launch catalysts`
              : "No active launch catalysts"}
          </span>
        }
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Projection Chart
// ─────────────────────────────────────────────────────────────

const formatDate = (dateStr) => {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload) return null;
  const data = payload[0]?.payload;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 shadow-xl text-xs space-y-1">
      <p className="text-slate-400 font-medium">{formatDate(label)}</p>
      {payload.map((entry, i) => {
        const isActual = entry.name === "Actual";
        return (
          <p key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-400">{entry.name}:</span>
            <span className="text-slate-200 font-mono font-medium">{entry.value?.toFixed(1)}</span>
            {isActual && data?.dailyChange !== null && data?.dailyChange !== undefined && (
              <span className={`font-mono text-[10px] ${data.dailyChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                ({data.dailyChange >= 0 ? "+" : ""}{data.dailyChange})
              </span>
            )}
          </p>
        );
      })}
    </div>
  );
}

function ProjectionChart({ chartData, loading }) {
  if (loading || !chartData || chartData.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-5">
        <div className="h-[300px] bg-slate-800/50 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={18} className="text-blue-400" />
        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
          Tweet Projection Forecast
        </h2>
      </div>
      <div className="w-full" style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="#475569"
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
              minTickGap={20}
            />
            <YAxis
              stroke="#475569"
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
              width={45}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11, color: "#94a3b8" }}
              iconType="circle"
              iconSize={8}
            />
            <Line
              type="monotone"
              dataKey="actual"
              name="Actual"
              stroke="#34d399"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="baseline"
              name="Baseline"
              stroke="#60a5fa"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="eventAdjusted"
              name="Event-Adjusted"
              stroke="#fb923c"
              strokeWidth={2}
              strokeDasharray="8 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Catalyst Timeline
// ─────────────────────────────────────────────────────────────

function CatalystTimeline({ events }) {
  const hasEvents = Array.isArray(events) && events.length > 0;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Rocket size={18} className="text-purple-400" />
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Active Catalyst Timeline
          </h2>
        </div>
        {hasEvents && (
          <span className="text-xs text-slate-500">
            {events.length} launch{events.length !== 1 ? "es" : ""} in window
          </span>
        )}
      </div>

      {!hasEvents ? (
        <EmptyEvents />
      ) : (
        <div className="space-y-2">
          {events.map((ev, i) => (
            <EventCard key={i} event={ev} />
          ))}
        </div>
      )}

      {hasEvents && (
        <div className="mt-4 p-3 rounded-lg bg-slate-900/60 border border-slate-800/50">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Info size={14} className="text-slate-500 shrink-0" />
            <span>
              Launch windows are 8-hour blocks centered on T-0. Starship flights
              apply a <strong className="text-purple-300">2.10×</strong> tweet rate
              multiplier; Falcon/Starlink flights apply{" "}
              <strong className="text-blue-300">1.25×</strong>.
              Tesla events (earnings, product launches) apply{" "}
              <strong className="text-amber-300">1.75×</strong> over 4 hours.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Arbitrage Calculator
// ─────────────────────────────────────────────────────────────

function ArbitrageCalculator() {
  const [prices, setPrices] = useState(["", "", ""]);
  const [bracketCount, setBracketCount] = useState(3);
  const [budget, setBudget] = useState("100");
  const [result, setResult] = useState(null);

  const changeBracketCount = (newCount) => {
    const clamped = Math.max(2, Math.min(5, newCount));
    if (clamped === bracketCount) return;
    setBracketCount(clamped);
    setPrices((prev) => {
      if (prev.length === clamped) return prev;
      if (prev.length < clamped) {
        return [...prev, ...Array(clamped - prev.length).fill("")];
      }
      return prev.slice(0, clamped);
    });
    setResult(null);
  };

  const handlePriceChange = (index, value) => {
    const next = [...prices];
    next[index] = value;
    setPrices(next);
    setResult(null);
  };

  const calculate = () => {
    const budgetNum = parseFloat(budget);
    if (isNaN(budgetNum) || budgetNum <= 0) {
      setResult({ error: "Enter a valid budget amount" });
      return;
    }

    const nums = prices.map((p) => {
      const v = parseFloat(p);
      return isNaN(v) || v <= 0 ? null : v;
    });

    const valid = nums.filter((n) => n !== null);
    if (valid.length < 2) {
      setResult({ error: "Enter at least 2 valid share prices (e.g. 0.54 = 54¢)" });
      return;
    }

    // Polymarket prices ARE implied probabilities (e.g., 0.07 = 7%)
    const implied = valid; // price IS the probability
    const totalImplied = implied.reduce((a, b) => a + b, 0);
    const arbExists = totalImplied < 1;

    // Dutching: stakes proportional to price, equal payout across outcomes
    // Stake_i = (price_i / sum(prices)) * totalStake → payout = totalStake / sum(prices)
    const totalStake = budgetNum;
    const stakes = implied.map((i) => (i / totalImplied) * totalStake);
    const payout = totalStake / totalImplied;
    const profit = payout - totalStake;
    const roi = ((1 / totalImplied - 1) * 100);

    const details = valid.map((p, i) => ({
      price: p,
      probability: (p * 100).toFixed(2),
      stake: stakes[i].toFixed(2),
      payout: (stakes[i] / p).toFixed(2),
    }));

    setResult({
      details,
      totalImplied: (totalImplied * 100).toFixed(2),
      arbExists,
      totalStake: totalStake.toFixed(2),
      guaranteedPayout: payout.toFixed(2),
      profit: profit.toFixed(2),
      roi: roi.toFixed(2),
    });
  };

  const outcomeLabels = ["A", "B", "C", "D", "E"];
  const placeholders = ["0.54", "0.057", "0.032", "0.21", "0.11"];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <Calculator size={18} className="text-blue-400" />
        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
          Polymarket Arbitrage Calculator
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Enter share prices (the price IS the probability, e.g. 0.54 = 54%)
          </p>

          {/* Bracket count control */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-medium">Brackets:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => changeBracketCount(bracketCount - 1)}
                disabled={bracketCount <= 2}
                className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition-colors"
              >
                <Minus size={14} />
              </button>
              <span className="w-8 text-center text-sm font-mono font-bold text-slate-200 tabular-nums">
                {bracketCount}
              </span>
              <button
                onClick={() => changeBracketCount(bracketCount + 1)}
                disabled={bracketCount >= 5}
                className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Budget input */}
          <div>
            <label className="block text-xs text-slate-400 mb-1 font-medium">
              Budget
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <DollarSign size={14} />
              </span>
              <input
                type="text"
                value={budget}
                onChange={(e) => {
                  setBudget(e.target.value);
                  setResult(null);
                }}
                placeholder="100"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
              />
            </div>
          </div>

          {/* Price inputs */}
          {Array.from({ length: bracketCount }, (_, i) => (
            <div key={i}>
              <label className="block text-xs text-slate-400 mb-1 font-medium">
                Outcome {outcomeLabels[i]}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                  $
                </span>
                <input
                  type="text"
                  value={prices[i] ?? ""}
                  onChange={(e) => handlePriceChange(i, e.target.value)}
                  placeholder={placeholders[i]}
                  className="w-full pl-7 pr-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
                />
              </div>
            </div>
          ))}
          <button
            onClick={calculate}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
          >
            <Shuffle size={14} />
            Calculate Dutching Split
          </button>
        </div>

        {/* Results */}
        <div className="space-y-3">
          {!result && (
            <div className="flex items-center justify-center h-full min-h-[200px]">
              <div className="text-center">
                <ArrowRight size={24} className="mx-auto text-slate-600 mb-2" />
                <p className="text-slate-500 text-sm">
                  Enter prices and calculate to see optimal stake splits
                </p>
              </div>
            </div>
          )}

          {result?.error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              <AlertTriangle size={14} className="shrink-0" />
              {result.error}
            </div>
          )}

          {result && !result.error && (
            <>
              {/* Summary */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
                  <div className="text-[10px] text-slate-500 uppercase font-medium">
                    Total Implied
                  </div>
                  <div className={`text-lg font-bold ${result.arbExists ? "text-emerald-400" : "text-red-400"}`}>
                    {result.totalImplied}%
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
                  <div className="text-[10px] text-slate-500 uppercase font-medium">
                    ROI
                  </div>
                  <div className={`text-lg font-bold ${result.arbExists ? "text-emerald-400" : "text-red-400"}`}>
                    {result.roi}%
                  </div>
                </div>
              </div>

              {/* Status */}
              <div
                className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 ${result.arbExists
                    ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                    : "bg-amber-500/10 border border-amber-500/30 text-amber-300"
                  }`}
              >
                {result.arbExists ? (
                  <>
                    <TrendingUp size={14} />
                    Arbitrage opportunity! Guaranteed ${result.profit} profit on
                    ${result.totalStake} stake
                  </>
                ) : (
                  <>
                    <Info size={14} />
                    No arbitrage — total implied probability exceeds 100%
                  </>
                )}
              </div>

              {/* Stake breakdown */}
              <div className="space-y-1.5">
                <p className="text-[10px] text-slate-500 uppercase font-medium">
                  Stake Allocation
                </p>
                {result.details.map((d, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded bg-slate-800/30 text-xs"
                  >
                    <span className="text-slate-400">
                      Outcome {outcomeLabels[i]} ({d.probability}%)
                    </span>
                    <span className="text-slate-200 font-mono font-medium">
                      ${d.stake}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between p-2 rounded bg-slate-800/50 text-xs font-medium">
                  <span className="text-slate-300">Total Stake</span>
                  <span className="text-slate-100 font-mono">
                    ${result.totalStake}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-800/50 text-xs font-medium">
                  <span className="text-slate-300">Guaranteed Payout</span>
                  <span className="text-emerald-400 font-mono">
                    ${result.guaranteedPayout}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────────────────────

function Footer() {
  return (
    <div className="border-t border-slate-800/50 mt-8 pt-4 pb-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-slate-600">
        <span>
          ElonTracker Live &mdash; Data sourced from Polymarket &amp; SpaceX
          Launch Library
        </span>
        <div className="flex items-center gap-3">
          <a
            href="https://polymarket.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-slate-400 transition-colors"
          >
            Polymarket <ExternalLink size={10} />
          </a>
          <span>&middot;</span>
          <span>Not financial advice</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Dashboard Page
// ─────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTrackingId, setSelectedTrackingId] = useState(null);
  const dataRef = useRef(null);
  const intervalRef = useRef(null);

  // Read trackingId from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tid = params.get("trackingId");
    if (tid) setSelectedTrackingId(tid);
  }, []);

  // Keep ref in sync for use inside fetch callback
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const fetchData = useCallback(async (isManualRefresh) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (selectedTrackingId) params.set("trackingId", selectedTrackingId);
      const qs = params.toString();
      const res = await fetch(`/api/tracker${qs ? `?${qs}` : ""}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail ?? `HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      // Only show error overlay if we have no cached data to display
      if (!dataRef.current) setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedTrackingId]);

  // Auto-poll every 30s; defer initial fetch so it's not synchronous within the effect
  useEffect(() => {
    const id = setInterval(() => fetchData(), 30_000);
    setTimeout(() => fetchData(), 0);
    return () => clearInterval(id);
  }, [fetchData]);

  const handleRefresh = () => {
    clearInterval(intervalRef.current);
    fetchData(true);
    intervalRef.current = setInterval(() => fetchData(), 30_000);
  };

  const handleSelectTracking = (id) => {
    if (String(id) === String(selectedTrackingId)) return;
    setSelectedTrackingId(id);
    setLoading(true);
    setData(null);
    setError(null);
  };

  if (loading && !data) return <LoadingSkeleton />;
  if (error && !data) return <ErrorState message={error} onRetry={() => fetchData(true)} />;

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <HeaderBlock
          data={data}
          trackings={data?.availableTrackings}
          selectedId={selectedTrackingId}
          onSelectTracking={handleSelectTracking}
          lastUpdated={lastUpdated}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
        <MetricGrid data={data} loading={loading} />
        <ProjectionChart chartData={data?.chartData} loading={loading} />
        <CatalystTimeline events={data?.events} />
        <ArbitrageCalculator />
        <Footer />
      </div>
    </div>
  );
}