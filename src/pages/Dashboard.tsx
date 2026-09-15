import { useState, useEffect, useMemo, useRef } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { AlertTriangle, Calendar, Users, UserX, Clock, CalendarDays, CalendarRange, CalendarClock } from "lucide-react";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import { format, subDays, startOfYear as dfStartOfYear } from "date-fns";
import {
  getMetrics,
  getRegistrationTrend,
  getVisaExpiryAlerts,
  getNationalityDistribution,
  getSimInventorySummary,
  getMsisdnPoolSummary,
  listSubscribers,
  listNotifications,
} from "@/api/client";
import { useToast } from "@/components/ui/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { NationalityDistribution } from "@/components/dashboard/NationalityDistribution/NationalityDistribution";
import { KpiCard } from "@/components/kyc/KpiCard";
import { QuickActions } from "@/components/kyc/QuickActions";
import { formatDateEAT } from "@/lib/formatDate";
import { toExpiryTiles } from "@/lib/visaBuckets";

const VISA_RANGES: { key: "7d" | "1m" | "6m" | "1y"; label: string; totalLabel: string }[] = [
  { key: "7d", label: "7 Days", totalLabel: "expiring within 7 days" },
  { key: "1m", label: "1 Month", totalLabel: "expiring within 1 month" },
  { key: "6m", label: "6 Months", totalLabel: "expiring within 6 months" },
  { key: "1y", label: "1 Year", totalLabel: "expiring within 1 year" },
];

const STATUS_COLORS: Record<string, string> = {
  active: "bg-kyc-brand-tint text-kyc-brand",
  suspended: "bg-kyc-warning-tint text-kyc-warning",
  deregistered: "bg-kyc-danger-tint text-kyc-danger",
};

interface CommittedRange {
  from: Date;
  to: Date;
}

const RANGE_PRESETS: { key: string; label: string; range: () => CommittedRange }[] = [
  { key: "7d", label: "Last 7 days", range: () => ({ from: subDays(new Date(), 6), to: new Date() }) },
  { key: "30d", label: "Last 30 days", range: () => ({ from: subDays(new Date(), 29), to: new Date() }) },
  { key: "90d", label: "Last 90 days", range: () => ({ from: subDays(new Date(), 89), to: new Date() }) },
  { key: "year", label: "This year", range: () => ({ from: dfStartOfYear(new Date()), to: new Date() }) },
];

function toIso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatRangeLabel(range: CommittedRange) {
  return `${format(range.from, "MMM d")} – ${format(range.to, "MMM d, yyyy")}`;
}

function summaryCount(summary: { status: string; _count: { status: number } }[] | undefined, status: string) {
  return summary?.find((s) => s.status === status)?._count.status ?? 0;
}

function sumTrend(rows: { count: number }[]) {
  return rows.reduce((s, r) => s + r.count, 0);
}

/** Real calendar date-range picker driving the Nationality Distribution map
 * and the Registration Trend chart — deliberately NOT wired to the
 * fixed-window KPI cards (Today/This Month/This Year are specific named
 * windows, not "in range"), the forward-looking Visa Expiry card, or the
 * recency-based Recent Registrations / Expiring Visas lists. Presets are
 * shortcuts that apply immediately; a custom drag-selected range needs
 * explicit Apply so an in-progress selection can't half-commit. */
function DateRangePicker({
  value,
  onChange,
}: {
  value: CommittedRange;
  onChange: (range: CommittedRange) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const openPicker = () => {
    setDraft(value);
    setOpen(true);
  };

  const applyDraft = () => {
    if (draft?.from && draft?.to) {
      onChange({ from: draft.from, to: draft.to });
      setOpen(false);
    }
  };

  const applyPreset = (preset: (typeof RANGE_PRESETS)[number]) => {
    onChange(preset.range());
    setOpen(false);
  };

  return (
    <div className="relative kyc-daypicker" ref={ref}>
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPicker())}
        className="flex items-center gap-1.5 rounded-lg border border-kyc-border bg-white px-3 py-1.5 text-xs font-medium text-kyc-text-primary hover:bg-slate-50 transition-colors"
      >
        <Calendar className="h-3.5 w-3.5 text-kyc-text-secondary" />
        {formatRangeLabel(value)}
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1.5 flex overflow-hidden rounded-2xl border border-kyc-border bg-white shadow-card">
          <div className="w-36 flex-shrink-0 border-r border-kyc-border p-1.5">
            {RANGE_PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => applyPreset(p)}
                className="block w-full rounded-md px-2.5 py-1.5 text-left text-xs font-medium text-kyc-text-primary hover:bg-kyc-brand-tint hover:text-kyc-brand transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="p-2">
            <DayPicker
              mode="range"
              selected={draft}
              onSelect={setDraft}
              numberOfMonths={2}
              defaultMonth={value.from}
              disabled={{ after: new Date() }}
            />
            <div className="flex items-center justify-end gap-2 border-t border-kyc-border px-1 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-kyc-text-secondary hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyDraft}
                disabled={!draft?.from || !draft?.to}
                className="rounded-lg bg-kyc-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-kyc-brand-deep transition-colors disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [today, setToday] = useState(0);
  const [thisMonth, setThisMonth] = useState(0);
  const [thisYear, setThisYear] = useState(0);
  const [dateRange, setDateRange] = useState<CommittedRange>(() => RANGE_PRESETS[1].range());
  const [trendData, setTrendData] = useState<{ label: string; count: number }[]>([]);
  const [trendChangePct, setTrendChangePct] = useState<number | null>(null);
  const [visaRange, setVisaRange] = useState<"7d" | "1m" | "6m" | "1y">("7d");
  const [visaBreakdown, setVisaBreakdown] = useState<{ label: string; expiring: number; active: number }[]>([]);
  const [nationality, setNationality] = useState<any[]>([]);
  const [simAvailable, setSimAvailable] = useState(0);
  const [msisdnAvailable, setMsisdnAvailable] = useState(0);
  const [recentRegistrations, setRecentRegistrations] = useState<any[]>([]);
  const [expiringVisas, setExpiringVisas] = useState<any[]>([]);
  const [alertCount, setAlertCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  // Fixed-window KPIs — deliberately independent of the header date-range
  // picker below. Each is its own explicit, named query rather than a
  // client-side reconstruction, so "This Month" can never silently drift
  // from what the backend actually has for the current calendar month.
  useEffect(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const todayIso = toIso(now);

    Promise.all([
      getMetrics(),
      getVisaExpiryAlerts("7d"),
      getSimInventorySummary(),
      getMsisdnPoolSummary(),
      listSubscribers({ limit: "5", sort_by: "registeredAt", sort_dir: "desc" }),
      listSubscribers({ status: "active", limit: "5", sort_by: "visaExpiryDate", sort_dir: "asc" }),
      listNotifications({ unread: "true", limit: "50" }),
      getRegistrationTrend({ from: todayIso, to: todayIso }),
      getRegistrationTrend({ from: toIso(startOfMonth), to: todayIso }),
      getRegistrationTrend({ from: toIso(startOfYear), to: todayIso }),
    ])
      .then(([m, vb, simSummary, msisdnSummary, recent, expiring, notif, todayTrend, monthTrend, yearTrend]) => {
        setMetrics(m);
        setVisaBreakdown((vb as any).data ?? []);
        setSimAvailable(summaryCount(simSummary.status, "available"));
        setMsisdnAvailable(summaryCount(msisdnSummary.status, "available"));
        setRecentRegistrations((recent as any).data ?? []);
        setExpiringVisas((expiring as any).data ?? []);
        setAlertCount((notif.data ?? []).length);
        setToday(sumTrend(todayTrend));
        setThisMonth(sumTrend(monthTrend));
        setThisYear(sumTrend(yearTrend));
      })
      .catch((err) => toast({ title: "Error loading dashboard", description: err.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [toast]);

  // Header date-range picker — drives Nationality Distribution + Registration
  // Trend only (see DateRangePicker's doc comment for why the rest of the
  // dashboard stays independent of it). The "vs previous period" comparison
  // uses an equal-length window immediately preceding the selected range,
  // whatever its actual length (no longer tied to a fixed preset.days).
  useEffect(() => {
    const { from, to } = dateRange;
    const rangeDays = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400000) + 1);
    const priorTo = subDays(from, 1);
    const priorFrom = subDays(priorTo, rangeDays - 1);

    Promise.all([
      getNationalityDistribution(toIso(from), toIso(to)),
      getRegistrationTrend({ from: toIso(from), to: toIso(to) }),
      getRegistrationTrend({ from: toIso(priorFrom), to: toIso(priorTo) }),
    ])
      .then(([n, current, prior]) => {
        setNationality((n as any) ?? []);
        setTrendData(current);
        const currentTotal = sumTrend(current);
        const priorTotal = sumTrend(prior);
        setTrendChangePct(priorTotal > 0 ? ((currentTotal - priorTotal) / priorTotal) * 100 : null);
      })
      .catch((err) => toast({ title: "Error loading range data", description: err.message, variant: "destructive" }));
  }, [dateRange, toast]);

  useEffect(() => {
    getVisaExpiryAlerts(visaRange)
      .then((res) => setVisaBreakdown(res.data))
      .catch((err) => toast({ title: "Error loading visa expiry data", description: err.message, variant: "destructive" }));
  }, [visaRange, toast]);

  const activeVisaRange = VISA_RANGES.find((r) => r.key === visaRange)!;
  const expiryTiles = useMemo(() => toExpiryTiles(visaBreakdown), [visaBreakdown]);
  const expiringTotalForRange = useMemo(() => visaBreakdown.reduce((s, b) => s + b.expiring, 0), [visaBreakdown]);
  const trendTotal = useMemo(() => sumTrend(trendData), [trendData]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-kyc-brand rounded-full animate-spin" />
      </div>
    );
  }

  const total = metrics?.total_tourists ?? 0;
  const active = metrics?.active_sims ?? 0;
  const suspended = metrics?.suspended ?? 0;
  const activePct = total > 0 ? Math.round((active / total) * 100) : 0;
  const suspendedPct = total > 0 ? Math.round((suspended / total) * 100) : 0;
  const expiringSoon = metrics?.expiring_soon ?? 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Greeting header — Layout.tsx already renders the global NotificationBell */}
      <div className="flex flex-wrap items-center min-h-[72px] justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-kyc-text-primary">
            {greeting}, {user?.name ?? "there"} 👋
          </h1>
          <p className="mt-0.5 text-sm text-kyc-text-secondary">Here's what's happening with tourist registrations today.</p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-kyc-brand-tint text-kyc-brand text-xs font-bold">
            {user?.name?.[0]?.toUpperCase() ?? "A"}
          </div>
        </div>
      </div>

      {alertCount > 0 && (
        <Link
          to="/subscribers/suspensions"
          className="flex flex-shrink-0 items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 hover:bg-amber-100 transition-colors"
        >
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>{alertCount} unread notification{alertCount === 1 ? "" : "s"} — visa expiries and system alerts</span>
          <span className="ml-auto underline font-medium">View notifications</span>
        </Link>
      )}

      {/* KPI row — 12-column grid, 6 cards at col-span-2 each, fixed height */}
      <div className="grid flex-shrink-0 grid-cols-2 sm:grid-cols-3 lg:grid-cols-12 gap-3 h-[115px] grid-rows-[100%] overflow-hidden">
        <div className="lg:col-span-2 h-full">
          <KpiCard
            title="Total Tourists Registered"
            value={total}
            icon={Users}
            breakdown={{ active, suspended, activePct, suspendedPct }}
          />
        </div>
        <div className="lg:col-span-2 h-full">
          <KpiCard title="Registered Today" value={today} icon={CalendarDays} variant="primary" />
        </div>
        <div className="lg:col-span-2 h-full">
          <KpiCard title="This Month" value={thisMonth} icon={CalendarRange} variant="secondary" />
        </div>
        <div className="lg:col-span-2 h-full">
          <KpiCard title="This Year" value={thisYear} icon={CalendarClock} variant="secondary" />
        </div>
        <div className="lg:col-span-2 h-full">
          <KpiCard title="Deregistered" value={metrics?.deregistered ?? 0} icon={UserX} variant="warning" />
        </div>
        <div className="lg:col-span-2 h-full">
          <KpiCard title="Expiring ≤ 7 Days" value={expiringSoon} icon={Clock} variant={expiringSoon > 0 ? "danger" : "default"} />
        </div>
      </div>

      {/* Main row — 8 cols map / 4 cols trend+visa. Fixed height, not a
          viewport-fit flex proportion, so the page scrolls naturally on
          short screens and the map + trend/visa cards share the same real
          vertical boundaries. 580px (not an even round number) is sized to
          the actual measured content need of the taller of the two stacked
          cards (Visa Expiry: title/toggle row + summary + 4 tiles + a
          144px-min chart + status legend ≈ 319px, vs Registration Trend's
          lighter ≈224px) — see the uneven split below. */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:items-stretch h-[380px] lg:h-[580px] grid-rows-[100%] overflow-hidden">
        <div className="lg:col-span-8 h-full rounded-2xl border border-kyc-border bg-white shadow-card p-5 overflow-hidden">
          <NationalityDistribution data={nationality} />
        </div>

        <div className="lg:col-span-4 flex flex-col gap-4 lg:h-full">
          {/* Fixed (not flex-1) — Registration Trend's content is lighter
              than Visa Expiry's, so an even 50/50 split starves Visa Expiry.
              235px comfortably fits its own ~224px of content; Visa Expiry
              below takes the rest of the column via flex-1. */}
          <div className="h-[235px] flex-shrink-0 overflow-hidden rounded-2xl border border-kyc-border bg-white shadow-card p-5 flex flex-col">
            <div className="flex items-center justify-between mb-2 flex-shrink-0">
              <span className="text-sm font-semibold text-kyc-text-primary">Registration Trend</span>
              <span className="text-[11px] text-kyc-text-secondary">{formatRangeLabel(dateRange)}</span>
            </div>
            <div className="flex-1 min-h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradBrand" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8A4B2F" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#8A4B2F" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#6B7280" }} interval="preserveStartEnd" />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#6B7280" }} width={24} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12 }} cursor={{ stroke: "#E5E7EB" }} />
                  <Area type="monotone" dataKey="count" stroke="#8A4B2F" strokeWidth={2} fill="url(#gradBrand)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-1 text-[11px] text-kyc-text-secondary truncate flex-shrink-0">
              <strong className="font-semibold text-kyc-text-primary">{trendTotal.toLocaleString()}</strong> total registrations
              {trendChangePct !== null && (
                <>
                  {" · "}
                  <span className={trendChangePct >= 0 ? "text-kyc-success" : "text-kyc-danger"}>
                    {trendChangePct >= 0 ? "↑" : "↓"} {Math.abs(trendChangePct).toFixed(1)}%
                  </span>{" "}
                  vs previous period
                </>
              )}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden rounded-2xl border border-kyc-border bg-white shadow-card p-5 flex flex-col">
            <div className="flex flex-nowrap items-center justify-between mb-1.5 flex-shrink-0 gap-2">
              <span className="flex-shrink-0 text-sm font-semibold text-kyc-text-primary">Visa Expiry</span>
              <div className="flex flex-shrink-0 rounded-lg border border-kyc-border p-0.5">
                {VISA_RANGES.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => setVisaRange(r.key)}
                    className={`px-1.5 py-0.5 text-[10px] font-medium rounded-md transition-colors ${
                      visaRange === r.key ? "bg-kyc-brand text-white" : "text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 flex-shrink-0">
              <span className="text-2xl font-bold text-kyc-text-primary">{expiringTotalForRange}</span>
              <span className="text-[12px] text-kyc-text-secondary">{activeVisaRange.totalLabel}</span>
              {expiringSoon > 0 && visaRange === "7d" && (
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-kyc-warning-tint px-2 py-0.5 text-[10px] font-medium text-kyc-warning">
                  <AlertTriangle className="h-3 w-3" /> Requires attention
                </span>
              )}
            </div>
            <div className="mt-2 grid grid-cols-4 gap-1.5 flex-shrink-0">
              {expiryTiles.map((b, i) => (
                <div key={`${b.label}-${i}`} className="rounded-lg bg-slate-50 py-1.5 text-center">
                  <div className="text-sm font-semibold text-kyc-text-primary">{b.value}</div>
                  <div className="text-[9.5px] leading-tight text-kyc-text-secondary truncate">{b.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-2 flex-1 min-h-[144px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={visaBreakdown} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 9.5, fill: "#6B7280" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9.5, fill: "#6B7280" }} width={20} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12 }} />
                  <Bar dataKey="expiring" fill="#F59E0B" radius={[3, 3, 0, 0]} maxBarSize={16} name="Expiring" />
                  <Bar dataKey="active" fill="#CBD5E1" radius={[3, 3, 0, 0]} maxBarSize={16} name="Still active" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between flex-shrink-0 pt-1">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-kyc-warning" /><span className="text-[10px] text-kyc-text-secondary">Expiring</span></span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-300" /><span className="text-[10px] text-kyc-text-secondary">Still active</span></span>
              </div>
              <Link to="/subscribers?status=active&sort_by=visaExpiryDate&sort_dir=asc" className="text-[11px] font-medium text-kyc-brand hover:underline">
                View expiring tourists →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row — 3 equal columns (4/4/4). Deliberately no fixed height
          here (unlike the rows above): Quick Actions has a fixed, known
          amount of content (3 actions + a 2-stat footer, ≈343px) that must
          never scroll or clip, while the two tables already handle
          arbitrary row counts via their own internal `overflow-y-auto`.
          So the row is left to size itself to its tallest natural-content
          item (Quick Actions) via normal grid auto-sizing, and
          `items-stretch` matches the tables to whatever that ends up
          being — safe to leave unbounded since this is the last row on the
          page, so a taller Quick Actions just grows the page, never
          overlaps anything below it. */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:items-stretch">
        <div className="lg:col-span-4 h-full">
          <MiniTable
            title="Recent Registrations"
            viewAllTo="/subscribers"
            rows={recentRegistrations}
            columns={[
              { header: "Name", widthClass: "w-[32%]", truncate: true, render: (r) => `${r.surname} ${r.otherNames}` },
              { header: "Nationality", widthClass: "w-[26%]", truncate: true, render: (r) => r.nationality?.name ?? r.nationalityCode ?? "—" },
              { header: "Date", widthClass: "w-[22%]", render: (r) => formatDateEAT(r.registeredAt) || "—" },
              {
                header: "Status",
                widthClass: "w-[20%]",
                render: (r) => (
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${STATUS_COLORS[r.status] ?? ""}`}>
                    {r.status}
                  </span>
                ),
              },
            ]}
            emptyText="No registrations yet"
          />
        </div>
        <div className="lg:col-span-4 h-full">
          <MiniTable
            title="Expiring Visas"
            viewAllTo="/subscribers"
            rows={expiringVisas}
            columns={[
              { header: "Name", widthClass: "w-[40%]", truncate: true, render: (r) => `${r.surname} ${r.otherNames}` },
              { header: "Nationality", widthClass: "w-[32%]", truncate: true, render: (r) => r.nationality?.name ?? r.nationalityCode ?? "—" },
              { header: "Visa Expiry", widthClass: "w-[28%]", render: (r) => formatDateEAT(r.visaExpiryDate) || "—" },
            ]}
            emptyText="No visas expiring soon"
          />
        </div>
        <div className="lg:col-span-4 h-full">
          <QuickActions simAvailable={simAvailable} msisdnAvailable={msisdnAvailable} />
        </div>
      </div>
    </div>
  );
}

function MiniTable({
  title,
  viewAllTo,
  rows,
  columns,
  emptyText,
}: {
  title: string;
  viewAllTo: string;
  rows: any[];
  columns: { header: string; widthClass?: string; truncate?: boolean; render: (row: any) => any }[];
  emptyText: string;
}) {
  const navigate = useNavigate();
  return (
    <div className="rounded-2xl border border-kyc-border bg-white shadow-card flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-kyc-border flex-shrink-0">
        <h3 className="text-sm font-semibold text-kyc-text-primary">{title}</h3>
        <Link to={viewAllTo} className="text-xs font-medium text-kyc-brand hover:underline">View all</Link>
      </div>
      {rows.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-kyc-text-secondary">{emptyText}</div>
      ) : (
        // Vertical scroll only — table-fixed + explicit column widths below
        // mean the columns always fit, so a horizontal scrollbar should
        // never be needed (and is explicitly disallowed here).
        <div className="overflow-y-auto overflow-x-hidden flex-1 min-h-0">
          <table className="w-full table-fixed text-sm">
            <thead>
              <tr className="text-left text-[11px] text-kyc-text-secondary border-b border-kyc-border">
                {columns.map((c) => (
                  <th key={c.header} className={`px-4 py-2 font-medium whitespace-nowrap ${c.widthClass ?? ""}`}>{c.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.id ?? i}
                  className="border-b border-kyc-border last:border-0 cursor-pointer hover:bg-slate-50"
                  onClick={() => row.id && navigate(`/subscribers/${row.id}`)}
                >
                  {columns.map((c) => (
                    <td
                      key={c.header}
                      className={`px-4 py-2.5 text-kyc-text-secondary ${c.widthClass ?? ""} ${c.truncate ? "truncate" : "whitespace-nowrap"}`}
                    >
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
