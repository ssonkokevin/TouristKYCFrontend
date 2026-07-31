import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { getReportByVisaType, getReportByPurpose, getReportByNationality } from "@/api/client";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download } from "lucide-react";

const COLORS = ["#059669", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"];

function toCsv(rows: { label: string; count: number }[]) {
  const header = "Label,Count\n";
  const body = rows.map((r) => `${r.label},${r.count}`).join("\n");
  return header + body;
}

function downloadCsv(filename: string, rows: { label: string; count: number }[]) {
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function ReportCard({
  title,
  data,
  filename,
  chart,
}: {
  title: string;
  data: { label: string; count: number }[];
  filename: string;
  chart: "bar" | "pie";
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-slate-900">{title}</span>
        <button
          onClick={() => downloadCsv(filename, data)}
          className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:underline"
        >
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      </div>
      {data.length === 0 ? (
        <div className="flex h-56 items-center justify-center text-sm text-slate-400">No data for selected range</div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {chart === "bar" ? (
              <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94A3B8" }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12 }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={36}>
                  {data.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <PieChart>
                <Pie data={data} dataKey="count" nameKey="label" outerRadius={90} innerRadius={50}>
                  {data.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12 }} />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export function ReportsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [visaType, setVisaType] = useState<any[]>([]);
  const [purpose, setPurpose] = useState<any[]>([]);
  const [nationality, setNationality] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    Promise.all([
      getReportByVisaType(from || undefined, to || undefined),
      getReportByPurpose(from || undefined, to || undefined),
      getReportByNationality(from || undefined, to || undefined),
    ])
      .then(([v, p, n]) => {
        setVisaType(v ?? []);
        setPurpose(p ?? []);
        setNationality(n ?? []);
      })
      .catch((err) => toast({ title: "Error loading reports", description: err.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Reports</h1>

      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">From</Label>
          <Input type="date" value={from} onChange={(e: any) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">To</Label>
          <Input type="date" value={to} onChange={(e: any) => setTo(e.target.value)} />
        </div>
        <button
          onClick={load}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
        >
          Apply
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ReportCard title="Registrations by Visa Type" data={visaType} filename="report_visa_type.csv" chart="bar" />
          <ReportCard title="Registrations by Purpose of Visit" data={purpose} filename="report_purpose.csv" chart="pie" />
          <ReportCard title="Registrations by Nationality" data={nationality} filename="report_nationality.csv" chart="bar" />
        </div>
      )}
    </div>
  );
}
