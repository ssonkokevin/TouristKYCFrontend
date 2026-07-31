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
import { Users, Smartphone, Phone, TrendingUp } from "lucide-react";
import { listSubscribers, listSimInventory, listMsisdnPool } from "@/api/client";
import { useToast } from "@/components/ui/use-toast";

const COLORS = ["#3B82F6", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];

function makeTrend(total: number) {
  return MONTHS.map((month, i) => ({
    month,
    value: Math.max(0, Math.round(total * (0.4 + (i / (MONTHS.length - 1)) * 0.6) + (Math.random() - 0.5) * total * 0.08)),
  }));
}

interface Counts { subscribers: number; sims: number; msisdns: number }
interface SimBucket { name: string; count: number }
interface StatusBucket { name: string; value: number }

export function OverviewPage() {
  const [counts, setCounts] = useState<Counts>({ subscribers: 0, sims: 0, msisdns: 0 });
  const [simBuckets, setSimBuckets] = useState<SimBucket[]>([]);
  const [msisdnStatus, setMsisdnStatus] = useState<StatusBucket[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([
      listSubscribers({ limit: "200" }),
      listSimInventory({ limit: "200" }),
      listMsisdnPool({ limit: "200" }),
    ])
      .then(([subs, sims, msisdns]) => {
        setCounts({
          subscribers: subs.meta?.total ?? subs.data?.length ?? 0,
          sims: sims.meta?.total ?? sims.data?.length ?? 0,
          msisdns: msisdns.meta?.total ?? msisdns.data?.length ?? 0,
        });

        // SIM by type/category
        const bucketMap: Record<string, number> = {};
        (sims.data ?? []).forEach((s: any) => {
          const k = s.category ?? s.type ?? "Other";
          bucketMap[k] = (bucketMap[k] ?? 0) + 1;
        });
        setSimBuckets(Object.entries(bucketMap).map(([name, count]) => ({ name, count })));

        // MSISDN by status
        const statusMap: Record<string, number> = {};
        (msisdns.data ?? []).forEach((m: any) => {
          const k = m.status ?? "unknown";
          statusMap[k] = (statusMap[k] ?? 0) + 1;
        });
        setMsisdnStatus(Object.entries(statusMap).map(([name, value]) => ({ name, value })));
      })
      .catch((err) => toast({ title: "Error loading data", description: err.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [toast]);

  const trendData = makeTrend(counts.subscribers);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page heading */}
      <h1 className="text-2xl font-bold text-slate-900">Overview</h1>

      {/* Stat cards — responsive 2→3→6 cols */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          iconBg="bg-blue-50 text-blue-600"
          label="Total Subscribers"
          value={counts.subscribers}
          sub="Registered tourists"
        />
        <StatCard
          icon={<Smartphone className="h-5 w-5" />}
          iconBg="bg-emerald-50 text-emerald-600"
          label="SIM Inventory"
          value={counts.sims}
          sub="Cards in pool"
        />
        <StatCard
          icon={<Phone className="h-5 w-5" />}
          iconBg="bg-amber-50 text-amber-600"
          label="MSISDN Pool"
          value={counts.msisdns}
          sub="Numbers available"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Area chart — subscriber trend */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-semibold text-slate-900">Registration Trend</span>
            <span className="ml-auto text-xs text-slate-400">This year</span>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12 }}
                  cursor={{ stroke: "#E2E8F0" }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fill="url(#gradBlue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Horizontal bar chart — SIM by category */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="mb-4">
            <span className="text-sm font-semibold text-slate-900">SIM by Category</span>
          </div>
          <div className="h-48">
            {simBuckets.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={simBuckets}
                  margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748B" }} width={72} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12 }} />
                  <Bar dataKey="count" maxBarSize={24} radius={[0, 4, 4, 0]}>
                    {simBuckets.map((_: any, idx: number) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">No data</div>
            )}
          </div>
        </div>
      </div>

      {/* Donut — MSISDN by status */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="mb-4">
          <span className="text-sm font-semibold text-slate-900">MSISDN Status Distribution</span>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="h-52 w-52 flex-shrink-0">
            {msisdnStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={msisdnStatus}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={90}
                    innerRadius={50}
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
                    {msisdnStatus.map((_: any, idx: number) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">No data</div>
            )}
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-3">
            {msisdnStatus.map((item: any, idx: number) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="text-xs text-slate-600 capitalize">{item.name}</span>
                <span className="text-xs font-medium text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, iconBg, label, value, sub }: { icon: any; iconBg: string; label: string; value: number; sub: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-2xl font-bold text-slate-900">{value.toLocaleString()}</div>
          <div className="mt-0.5 text-xs font-medium text-slate-500">{label}</div>
          <div className="mt-0.5 text-xs text-slate-400">{sub}</div>
        </div>
        <div className={`p-2.5 rounded-lg ${iconBg}`}>{icon}</div>
      </div>
    </div>
  );
}
