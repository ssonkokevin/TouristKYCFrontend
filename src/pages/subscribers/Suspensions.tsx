import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { listSuspensions, reactivateSubscriber } from "@/api/client";
import { useToast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Download, X } from "lucide-react";
import { formatDateTimeEAT } from "@/lib/formatDate";

const REASON_LABELS: Record<string, string> = {
  visa_expired: "Visa Expired",
  manual_review: "Manual Review",
  fraud_suspected: "Fraud Suspected",
  payment_issue: "Payment Issue",
  other: "Other",
};

const REASON_OPTIONS = [
  { value: "", label: "All reasons" },
  ...Object.entries(REASON_LABELS).map(([value, label]) => ({ value, label })),
];

function csvText(value: string) {
  // Force Excel to treat numeric-looking strings (passport no., MSISDN, IMSI, ICCID)
  // as text instead of converting to scientific notation / stripping leading zeros.
  return `="${(value ?? "").replace(/"/g, '""')}"`;
}

function toCsv(rows: any[]) {
  const header = "Name,MSISDN,Passport,Nationality,IMSI,ICCID,Reason,Suspended At (EAT),Suspended By\n";
  const body = rows
    .map((r) =>
      [
        `"${(r.subscriber?.surname ?? "") + " " + (r.subscriber?.otherNames ?? "")}"`,
        csvText(r.subscriber?.msisdnPool?.[0]?.msisdn),
        csvText(r.subscriber?.passportNumber),
        r.subscriber?.nationality?.name ?? "",
        csvText(r.subscriber?.simInventory?.imsi),
        csvText(r.subscriber?.simInventory?.iccid),
        REASON_LABELS[r.reason] ?? r.reason ?? "",
        formatDateTimeEAT(r.suspendedAt),
        r.suspendedBy ?? "",
      ].join(",")
    )
    .join("\n");
  return header + body;
}

function downloadCsv(filename: string, rows: any[]) {
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function SuspensionsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [name, setName] = useState("");
  const [msisdn, setMsisdn] = useState("");
  const [reason, setReason] = useState("");
  const [suspendedFrom, setSuspendedFrom] = useState("");
  const [suspendedTo, setSuspendedTo] = useState("");

  const { toast } = useToast();
  const navigate = useNavigate();

  const buildFilters = (limit: string) => {
    const params: Record<string, string> = { limit };
    if (name.trim()) params.name = name.trim();
    if (msisdn.trim()) params.msisdn = msisdn.trim();
    if (reason) params.reason = reason;
    if (suspendedFrom) params.suspended_from = `${suspendedFrom}T00:00:00.000`;
    if (suspendedTo) params.suspended_to = `${suspendedTo}T23:59:59.999`;
    return params;
  };

  const load = () => {
    setLoading(true);
    listSuspensions(buildFilters("100"))
      .then((res: any) => {
        setRows(res.data ?? []);
        setTotal(res.total ?? res.data?.length ?? 0);
      })
      .catch((err) => toast({ title: "Error", description: err.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const handle = setTimeout(load, 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, msisdn, reason, suspendedFrom, suspendedTo]);

  const hasFilters = useMemo(
    () => Boolean(name || msisdn || reason || suspendedFrom || suspendedTo),
    [name, msisdn, reason, suspendedFrom, suspendedTo]
  );

  const clearFilters = () => {
    setName("");
    setMsisdn("");
    setReason("");
    setSuspendedFrom("");
    setSuspendedTo("");
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res: any = await listSuspensions(buildFilters("5000"));
      downloadCsv("suspensions.csv", res.data ?? []);
    } catch (err: any) {
      toast({ title: "Export failed", description: err.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const handleReactivate = async (id: string) => {
    setBusyId(id);
    try {
      await reactivateSubscriber(id);
      toast({ title: "Subscriber reactivated" });
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold text-kyc-text-primary">Suspensions</h1>
        <span className="ml-2 rounded-full bg-kyc-warning-tint px-2.5 py-0.5 text-xs font-medium text-kyc-warning">{total}</span>
        <Button onClick={handleExport} disabled={exporting} variant="outline" size="sm" className="ml-auto gap-1.5">
          <Download className="h-3.5 w-3.5" />
          {exporting ? "Exporting…" : "Export CSV"}
        </Button>
      </div>

      <div className="bg-white rounded-card shadow-card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Name</Label>
            <Input placeholder="Surname or other names" value={name} onChange={(e: any) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">MSISDN</Label>
            <Input placeholder="Phone number" value={msisdn} onChange={(e: any) => setMsisdn(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Reason</Label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {REASON_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Suspended From</Label>
            <Input type="date" value={suspendedFrom} onChange={(e: any) => setSuspendedFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Suspended To</Label>
            <Input type="date" value={suspendedTo} onChange={(e: any) => setSuspendedTo(e.target.value)} />
          </div>
        </div>
        {hasFilters && (
          <button onClick={clearFilters} className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700">
            <X className="h-3.5 w-3.5" /> Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <ShieldAlert className="h-10 w-10 mb-3 opacity-40" />
          <span className="text-sm">{hasFilters ? "No suspensions match your filters" : "No suspended subscribers"}</span>
        </div>
      ) : (
        <div className="bg-white rounded-card shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">#</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Subscriber</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">MSISDN</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Passport No.</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Nationality</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Visa Expiry</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Reason</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Suspended At</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Suspended By</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row: any, idx: number) => (
                <TableRow key={row.subscriberId} className="hover:bg-kyc-brand-tint/40 transition-colors">
                  <TableCell className="text-slate-500 text-sm">{idx + 1}</TableCell>
                  <TableCell
                    className="font-medium text-slate-900 cursor-pointer hover:underline"
                    onClick={() => navigate(`/subscribers/${row.subscriberId}`)}
                  >
                    {row.subscriber?.surname} {row.subscriber?.otherNames}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-slate-600">{row.subscriber?.msisdnPool?.[0]?.msisdn ?? "—"}</TableCell>
                  <TableCell className="font-mono text-sm text-slate-600">{row.subscriber?.passportNumber}</TableCell>
                  <TableCell className="text-slate-600">{row.subscriber?.nationality?.name}</TableCell>
                  <TableCell className="text-slate-600 text-sm">
                    {row.subscriber?.visaExpiryDate ? new Date(row.subscriber.visaExpiryDate).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-kyc-warning-tint px-2.5 py-0.5 text-xs font-medium text-kyc-warning">
                      {REASON_LABELS[row.reason] ?? row.reason}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">{formatDateTimeEAT(row.suspendedAt)}</TableCell>
                  <TableCell className="text-slate-600 text-sm">{row.suspendedBy}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === row.subscriberId}
                      onClick={() => handleReactivate(row.subscriberId)}
                    >
                      {busyId === row.subscriberId ? "..." : "Reactivate"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
