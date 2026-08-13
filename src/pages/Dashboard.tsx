import { useState, useEffect } from "react";
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Users, Smartphone, ShieldAlert, UserX, TrendingUp, AlertTriangle, Clock, AlertOctagon, Inbox, PieChart as PieChartIcon } from "lucide-react";
import {
  getMetrics,
  getRegistrationTrend,
  getVisaExpiryAlerts,
  getNationalityDistribution,
  getPurposeDistribution,
  listNotifications,
} from "@/api/client";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";

const COLORS = ["#0F9D58", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"];
const RANGES: { key: "7d" | "1m" | "6m" | "1y"; label: string }[] = [
  { key: "7d", label: "7 Days" },
  { key: "1m", label: "1 Month" },
  { key: "6m", label: "6 Months" },
  { key: "1y", label: "1 Year" },
];

function formatRelativeTime(date: Date | null): string {
  if (!date) return "—";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [visaRange, setVisaRange] = useState<"7d" | "1m" | "6m" | "1y">("7d");
  const [visaData, setVisaData] = useState<any[]>([]);
  const [nationality, setNationality] = useState<any[]>([]);
  const [purpose, setPurpose] = useState<any[]>([]);
  const [alertCount, setAlertCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [, setTick] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([
      getMetrics(),
      getRegistrationTrend(30),
      getNationalityDistribution(),
      getPurposeDistribution(),
      listNotifications({ unread: "true", limit: "50" }),
    ])
      .then(([m, t, n, p, notif]) => {
        setMetrics(m);
        setTrend(t as any);
        setNationality((n as any) ?? []);
        setPurpose((p as any) ?? []);
        setAlertCount((notif.data ?? []).length);
        setLastUpdated(new Date());
      })
      .catch((err) => toast({ title: "Error loading dashboard", description: err.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    getVisaExpiryAlerts(visaRange)
      .then((res) => setVisaData(res.data))
      .catch((err) => toast({ title: "Error loading visa expiry chart", description: err.message, variant: "destructive" }));
  }, [visaRange, toast]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-kyc-text-primary">Tourist KYC Dashboard</h1>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-kyc-brand-tint px-2.5 py-1 text-xs font-medium text-kyc-brand">
          <span className="h-1.5 w-1.5 rounded-full bg-kyc-brand" />
          Updated {formatRelativeTime(lastUpdated)}
        </span>
      </div>

      {alertCount > 0 && (
        <Link
          to="/subscribers/suspensions"
          className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 hover:bg-amber-100 transition-colors"
        >
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>{alertCount} unread notification{alertCount === 1 ? "" : "s"} — visa expiries and system alerts</span>
          <span className="ml-auto underline font-medium">View notifications</span>
        </Link>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <StatCard icon={<Users className="h-5 w-5" />} tone="info" label="Total Tourists" value={metrics?.total_tourists ?? 0} sub="Updated today" />
        <StatCard icon={<Users className="h-5 w-5" />} tone="brand" label="Active" value={metrics?.active_sims ?? 0} sub={`of ${metrics?.total_tourists ?? 0} total`} />
        <StatCard icon={<ShieldAlert className="h-5 w-5" />} tone="warning" label="Suspended" value={metrics?.suspended ?? 0} sub="Updated today" />
        <StatCard icon={<UserX className="h-5 w-5" />} tone="danger" label="Deregistered" value={metrics?.deregistered ?? 0} sub="Updated today" />
        <StatCard icon={<Clock className="h-5 w-5" />} tone="warning" label="Expiring ≤7 days" value={metrics?.expiring_soon ?? 0} highlight={metrics?.expiring_soon > 0} sub="Next 7 days" />
        <StatCard icon={<AlertOctagon className="h-5 w-5" />} tone="danger" label="Visa Expired (active)" value={metrics?.visa_expired_active ?? 0} highlight={metrics?.visa_expired_active > 0} sub="Needs action" />
        <StatCard icon={<Smartphone className="h-5 w-5" />} tone="info" label="SIM Stock" value={metrics?.sim_stock_available ?? 0} sub="Available now" />
        <StatCard icon={<Smartphone className="h-5 w-5" />} tone="brand" label="SIM Assigned" value={metrics?.sim_stock_assigned ?? 0} sub="Updated today" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registration trend */}
        <div className="bg-white rounded-card shadow-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-kyc-brand" />
            <span className="text-sm font-semibold text-kyc-text-primary">Registration Trend (Last 30 days)</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0F9D58" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#0F9D58" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} interval={4} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12 }} cursor={{ stroke: "#E5E7EB" }} />
                <Area type="monotone" dataKey="count" stroke="#0F9D58" strokeWidth={2} fill="url(#gradGreen)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Visa expiry with range filter */}
        <div className="bg-white rounded-card shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-kyc-text-primary">Visa Expiry</span>
            <div className="flex rounded-lg border border-kyc-border p-0.5">
              {RANGES.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setVisaRange(r.key)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    visaRange === r.key ? "bg-kyc-brand text-white" : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={visaData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280" }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12 }} />
                <Bar dataKey="expiring" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={20} name="Expiring" />
                <Bar dataKey="active" fill="#CBD5E1" radius={[4, 4, 0, 0]} maxBarSize={20} name="Still active" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-2 justify-center">
            <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-kyc-warning" /><span className="text-xs text-kyc-text-secondary">Expiring</span></div>
            <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate-300" /><span className="text-xs text-kyc-text-secondary">Still active</span></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nationality distribution */}
        <div className="bg-white rounded-card shadow-card p-5">
          <div className="mb-4">
            <span className="text-sm font-semibold text-kyc-text-primary">Nationality Distribution</span>
          </div>
          {nationality.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 text-kyc-text-secondary">
              <Inbox className="h-6 w-6" />
              <span className="text-sm">No data</span>
            </div>
          ) : (
            <div className="space-y-3">
              {nationality.slice(0, 8).map((n: any, idx: number) => {
                const total = nationality.reduce((s: number, x: any) => s + (x.count ?? 0), 0);
                const pct = total > 0 ? Math.round(((n.count ?? 0) / total) * 100) : 0;
                return (
                  <div key={n.code ?? n.name ?? idx} className="flex items-center gap-3">
                    <span className="text-lg">{n.flagEmoji ?? "🏳️"}</span>
                    <span className="w-24 flex-shrink-0 text-sm text-slate-700 truncate">{n.name}</span>
                    <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS[idx % COLORS.length] }} />
                    </div>
                    <span className="w-10 text-right text-xs font-medium text-slate-600">{pct}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Purpose of visit donut */}
        <div className="bg-white rounded-card shadow-card p-5">
          <div className="mb-4">
            <span className="text-sm font-semibold text-kyc-text-primary">Purpose of Visit</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="h-44 w-44 flex-shrink-0">
              {purpose.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={purpose}
                      dataKey="count"
                      nameKey="purposeOfVisit"
                      outerRadius={80}
                      innerRadius={44}
                      labelLine={false}
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
                        const RADIAN = Math.PI / 180;
                        const r = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + r * Math.cos(-midAngle * RADIAN);
                        const y = cy + r * Math.sin(-midAngle * RADIAN);
                        return percent > 0.07 ? (
                          <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
                            {`${(percent * 100).toFixed(0)}%`}
                          </text>
                        ) : null;
                      }}
                    >
                      {purpose.map((_: any, idx: number) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-kyc-text-secondary">
                  <PieChartIcon className="h-6 w-6" />
                  <span className="text-sm">No data</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              {purpose.map((item: any, idx: number) => (
                <div key={item.purposeOfVisit ?? idx} className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-xs text-slate-600 capitalize">{item.purposeOfVisit}</span>
                  <span className="text-xs font-medium text-slate-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const TONE_CHIP: Record<string, string> = {
  brand: "bg-kyc-brand-tint text-kyc-brand",
  warning: "bg-kyc-warning-tint text-kyc-warning",
  danger: "bg-kyc-danger-tint text-kyc-danger",
  info: "bg-kyc-info-tint text-kyc-info",
};

function StatCard({
  icon,
  tone,
  label,
  value,
  sub,
  highlight,
}: {
  icon: any;
  tone: "brand" | "warning" | "danger" | "info";
  label: string;
  value: number;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div className={`bg-white rounded-card shadow-card p-5 ${highlight ? "ring-1 ring-kyc-danger/30" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={`text-2xl font-bold ${highlight ? "text-kyc-danger" : "text-kyc-text-primary"}`}>{value.toLocaleString()}</div>
          <div className="mt-0.5 text-xs font-medium text-slate-600">{label}</div>
          <div className="mt-0.5 text-xs text-kyc-text-secondary">{sub}</div>
        </div>
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px] ${TONE_CHIP[tone]}`}>{icon}</div>
      </div>
    </div>
  );
}
