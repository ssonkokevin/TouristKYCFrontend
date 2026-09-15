import { useState, useEffect } from "react";
import {
  getReportByNationality,
  getStatusDistribution,
  getRegistrationTrend,
  getVisaExpiryAlerts,
  getSimInventorySummary,
  getMsisdnPoolSummary,
  getSimProvisioningTrend,
  getMetrics,
  listSubscribers,
} from "@/api/client";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/kyc/PageHeader";
import { StatCard, TrendCard, DonutCard, RankCard, BarCard } from "@/components/reports/ReportCards";
import { RegistrationsTable } from "@/components/reports/RegistrationsTable";
import { toExpiryTiles } from "@/lib/visaBuckets";
import { Users, Globe2, Smartphone, Hash } from "lucide-react";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "registrations", label: "Registrations" },
  { key: "nationalities", label: "Nationalities" },
  { key: "visas", label: "Visas" },
  { key: "sim", label: "SIM Usage" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function toIso(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Falls back to the last 90 days for day-bucketed charts (trend/provisioning)
 * when no explicit range is applied — groupBy-based cards (nationality/status
 * breakdowns, the registrations table) are fine left as true "all time" when
 * unset, but a daily trend needs concrete bounds to bucket by day. */
function useEffectiveRange(from: string, to: string) {
  const today = new Date();
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(today.getDate() - 89);
  return { from: from || toIso(ninetyDaysAgo), to: to || toIso(today) };
}

function OverviewTab({ from, to }: { from: string; to: string }) {
  const [totalRegistrations, setTotalRegistrations] = useState(0);
  const [uniqueNationalities, setUniqueNationalities] = useState(0);
  const [trend, setTrend] = useState<{ label: string; count: number }[]>([]);
  const [byNationality, setByNationality] = useState<{ label: string; count: number }[]>([]);
  const [byStatus, setByStatus] = useState<{ label: string; count: number }[]>([]);
  const { toast } = useToast();
  const range = useEffectiveRange(from, to);

  useEffect(() => {
    Promise.all([
      listSubscribers({ page: "1", limit: "1", ...(from ? { registered_from: from } : {}), ...(to ? { registered_to: to } : {}) }),
      getReportByNationality(from || undefined, to || undefined),
      getStatusDistribution(from || undefined, to || undefined),
      getRegistrationTrend({ from: range.from, to: range.to }),
    ])
      .then(([subs, nat, status, trendData]) => {
        setTotalRegistrations((subs as any).total ?? 0);
        setUniqueNationalities((nat ?? []).length);
        setByNationality((nat ?? []).slice().sort((a: any, b: any) => b.count - a.count).slice(0, 8));
        setByStatus((status ?? []).map((s: any) => ({ label: s.status, count: s.count })));
        setTrend(trendData);
      })
      .catch((err) => toast({ title: "Error loading overview", description: err.message, variant: "destructive" }));
  }, [from, to, toast]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard title="Total Registrations" value={totalRegistrations} icon={Users} />
        <StatCard title="Unique Nationalities" value={uniqueNationalities} icon={Globe2} />
      </div>
      <TrendCard title="Registrations Over Time" data={trend} filename="report_registrations_over_time.csv" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DonutCard title="Registrations by Nationality" data={byNationality} filename="report_by_nationality_donut.csv" />
        <DonutCard title="Registrations by Status" data={byStatus} filename="report_by_status_donut.csv" />
      </div>
    </div>
  );
}

function NationalitiesTab({ from, to }: { from: string; to: string }) {
  const [data, setData] = useState<{ label: string; count: number }[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    getReportByNationality(from || undefined, to || undefined)
      .then((n) => setData((n ?? []).slice().sort((a: any, b: any) => b.count - a.count)))
      .catch((err) => toast({ title: "Error loading nationalities", description: err.message, variant: "destructive" }));
  }, [from, to, toast]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <RankCard title="Registrations by Nationality" data={data} filename="report_nationality_rank.csv" />
      <DonutCard title="Nationality Share" data={data.slice(0, 8)} filename="report_nationality_share.csv" />
    </div>
  );
}

function VisasTab() {
  // Deliberately not wired to the Reports date-range filter — this is a
  // forward-looking "expiring within X days" snapshot (same reasoning as
  // the dashboard's independent Visa Expiry toggle), not a historical range.
  const [buckets, setBuckets] = useState<{ label: string; count: number }[]>([]);
  const [statusDonut, setStatusDonut] = useState<{ label: string; count: number }[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([getVisaExpiryAlerts("7d"), getMetrics()])
      .then(([alerts, metrics]) => {
        setBuckets(toExpiryTiles(alerts.data).map((t) => ({ label: t.label, count: t.value })));
        const valid = Math.max(0, (metrics.active_sims ?? 0) - (metrics.expiring_soon ?? 0));
        setStatusDonut([
          { label: "Valid", count: valid },
          { label: "Expiring Soon (≤7d)", count: metrics.expiring_soon ?? 0 },
          { label: "Expired (pending suspend)", count: metrics.visa_expired_active ?? 0 },
        ]);
      })
      .catch((err) => toast({ title: "Error loading visa data", description: err.message, variant: "destructive" }));
  }, [toast]);

  return (
    <div className="space-y-4">
      <p className="text-xs text-kyc-text-secondary">
        This tab shows current expiry windows and isn't affected by the date range above — it's a live snapshot, not a historical range.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BarCard title="Expiring Visas by Window" data={buckets} filename="report_visa_windows.csv" height={240} />
        <DonutCard title="Visa Status" data={statusDonut} filename="report_visa_status.csv" colors={["#16A34A", "#F59E0B", "#EF4444"]} />
      </div>
    </div>
  );
}

function SimUsageTab({ from, to }: { from: string; to: string }) {
  const [simAvailable, setSimAvailable] = useState(0);
  const [msisdnAvailable, setMsisdnAvailable] = useState(0);
  const [trend, setTrend] = useState<{ label: string; count: number }[]>([]);
  const { toast } = useToast();
  const range = useEffectiveRange(from, to);

  useEffect(() => {
    Promise.all([getSimInventorySummary(), getMsisdnPoolSummary(), getSimProvisioningTrend(range.from, range.to)])
      .then(([sim, msisdn, provisioning]) => {
        setSimAvailable(sim.status.find((s: any) => s.status === "available")?._count.status ?? 0);
        setMsisdnAvailable(msisdn.status.find((s: any) => s.status === "available")?._count.status ?? 0);
        setTrend(provisioning);
      })
      .catch((err) => toast({ title: "Error loading SIM usage", description: err.message, variant: "destructive" }));
  }, [from, to, toast]);

  return (
    <div className="space-y-4">
      <p className="text-xs text-kyc-text-secondary">
        Stock counts below are a live snapshot (not scoped to the date range) — the provisioning chart is.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard title="Available SIM Stock" value={simAvailable} icon={Smartphone} />
        <StatCard title="Available MSISDN" value={msisdnAvailable} icon={Hash} />
      </div>
      <TrendCard title="Daily SIM Provisioning" data={trend} filename="report_sim_provisioning.csv" />
    </div>
  );
}

export function ReportsPage() {
  const [tab, setTab] = useState<TabKey>("overview");
  const [fromInput, setFromInput] = useState("");
  const [toInput, setToInput] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");

  const apply = () => {
    setAppliedFrom(fromInput);
    setAppliedTo(toInput);
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Reports" subtitle="Registration, nationality, visa, and SIM usage breakdowns with export." />

      <div className="rounded-2xl border border-kyc-border bg-white shadow-card p-4 flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-kyc-text-secondary uppercase tracking-wide">From</Label>
          <Input type="date" value={fromInput} onChange={(e: any) => setFromInput(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-kyc-text-secondary uppercase tracking-wide">To</Label>
          <Input type="date" value={toInput} onChange={(e: any) => setToInput(e.target.value)} />
        </div>
        <button
          onClick={apply}
          className="rounded-md bg-kyc-brand px-4 py-2 text-sm font-medium text-white hover:bg-kyc-brand-deep transition-colors"
        >
          Apply
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 rounded-lg border border-kyc-border bg-white p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3.5 py-1.5 text-sm font-medium rounded-md transition-colors ${
              tab === t.key ? "bg-kyc-brand text-white" : "text-kyc-text-secondary hover:bg-slate-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab from={appliedFrom} to={appliedTo} />}
      {tab === "registrations" && (
        <div className="space-y-4">
          <RegistrationsTable from={appliedFrom || undefined} to={appliedTo || undefined} />
        </div>
      )}
      {tab === "nationalities" && <NationalitiesTab from={appliedFrom} to={appliedTo} />}
      {tab === "visas" && <VisasTab />}
      {tab === "sim" && <SimUsageTab from={appliedFrom} to={appliedTo} />}
    </div>
  );
}
