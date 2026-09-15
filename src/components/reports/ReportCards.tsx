import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, PieChart, Pie, Legend, AreaChart, Area } from "recharts";
import { Download } from "lucide-react";
import type { ComponentType } from "react";

const TERRACOTTA = "#8A4B2F";
export const DONUT_PALETTE = ["#8A4B2F", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"];

export function toCsv(rows: { label: string; count: number }[]) {
  const header = "Label,Count\n";
  const body = rows.map((r) => `${r.label},${r.count}`).join("\n");
  return header + body;
}

export function downloadCsv(filename: string, rows: { label: string; count: number }[]) {
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-md text-xs font-medium border border-kyc-border text-kyc-text-primary hover:bg-slate-50 transition-colors"
    >
      <Download className="w-3.5 h-3.5" /> Export
    </button>
  );
}

export function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  icon?: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-kyc-border bg-white shadow-card p-4 flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        {Icon && (
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-kyc-brand-tint flex-shrink-0">
            <Icon className="w-3.5 h-3.5 text-kyc-brand" />
          </div>
        )}
        <span className="text-xs text-kyc-text-secondary truncate">{title}</span>
      </div>
      <span className="text-2xl font-bold tracking-tight text-kyc-text-primary">
        {typeof value === "number" ? value.toLocaleString() : value}
      </span>
    </div>
  );
}

export function BarCard({
  title,
  data,
  filename,
  height = 220,
}: {
  title: string;
  data: { label: string; count: number }[];
  filename: string;
  height?: number;
}) {
  return (
    <div className="rounded-2xl border border-kyc-border bg-white shadow-card p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-kyc-text-primary">{title}</h3>
        <ExportButton onClick={() => downloadCsv(filename, data)} />
      </div>
      {data.length === 0 ? (
        <div className="flex h-56 items-center justify-center text-sm text-kyc-text-secondary">No data for selected range</div>
      ) : (
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E0DB" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} interval={0} angle={-12} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E7E0DB", fontSize: 12 }} cursor={{ fill: "rgba(138,75,47,0.06)" }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={42}>
                {data.map((_, idx) => (
                  <Cell key={idx} fill={TERRACOTTA} fillOpacity={1 - idx * 0.08} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export function TrendCard({
  title,
  data,
  filename,
  height = 240,
}: {
  title: string;
  data: { label: string; count: number }[];
  filename: string;
  height?: number;
}) {
  return (
    <div className="rounded-2xl border border-kyc-border bg-white shadow-card p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-kyc-text-primary">{title}</h3>
        <ExportButton onClick={() => downloadCsv(filename, data)} />
      </div>
      {data.length === 0 ? (
        <div className="flex h-56 items-center justify-center text-sm text-kyc-text-secondary">No data for selected range</div>
      ) : (
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="gradReportTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={TERRACOTTA} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={TERRACOTTA} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E0DB" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E7E0DB", fontSize: 12 }} />
              <Area type="monotone" dataKey="count" stroke={TERRACOTTA} strokeWidth={2} fill="url(#gradReportTrend)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export function RankCard({ title, data, filename }: { title: string; data: { label: string; count: number }[]; filename: string }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="rounded-2xl border border-kyc-border bg-white shadow-card p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-kyc-text-primary">{title}</h3>
        <ExportButton onClick={() => downloadCsv(filename, data)} />
      </div>
      {data.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-sm text-kyc-text-secondary">No data for selected range</div>
      ) : (
        <div className="space-y-2.5 flex-1">
          {data.map((d) => (
            <div key={d.label} className="flex items-center gap-3">
              <span className="text-xs text-kyc-text-primary w-32 truncate">{d.label}</span>
              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(d.count / max) * 100}%`, backgroundColor: TERRACOTTA }} />
              </div>
              <span className="text-xs font-medium text-kyc-text-primary w-10 text-right">{d.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function DonutCard({
  title,
  data,
  filename,
  colors = DONUT_PALETTE,
}: {
  title: string;
  data: { label: string; count: number }[];
  filename: string;
  colors?: string[];
}) {
  return (
    <div className="rounded-2xl border border-kyc-border bg-white shadow-card p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-kyc-text-primary">{title}</h3>
        <ExportButton onClick={() => downloadCsv(filename, data)} />
      </div>
      {data.length === 0 ? (
        <div className="flex h-56 items-center justify-center text-sm text-kyc-text-secondary">No data for selected range</div>
      ) : (
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="count" nameKey="label" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {data.map((_, idx) => (
                  <Cell key={idx} fill={colors[idx % colors.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E7E0DB", fontSize: 12 }} />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconSize={8}
                wrapperStyle={{ fontSize: 11, color: "#64748B" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
