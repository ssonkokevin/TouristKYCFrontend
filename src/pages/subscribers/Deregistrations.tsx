import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { listDeregistrations } from "@/api/client";
import { useToast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { UserX, Download, X } from "lucide-react";
import { formatDateTimeEAT } from "@/lib/formatDate";

const REASON_LABELS: Record<string, string> = {
  visa_expired_deregistered: "Visa Expired",
  lost_card: "Lost Card",
  change_of_number: "Change of Number",
  customer_not_interested: "Customer Not Interested",
  voluntary_deregistration: "Voluntary",
  fraud_suspected: "Fraud Suspected",
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
  const header = "Name,MSISDN,Passport,Nationality,IMSI,ICCID,Reason,Operator,Deregistered At (EAT)\n";
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
        r.operator ?? "",
        formatDateTimeEAT(r.deregisteredAt),
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

export function DeregistrationsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [name, setName] = useState("");
  const [msisdn, setMsisdn] = useState("");
  const [reason, setReason] = useState("");
  const [deregisteredFrom, setDeregisteredFrom] = useState("");
  const [deregisteredTo, setDeregisteredTo] = useState("");

  const { toast } = useToast();
  const navigate = useNavigate();

  const buildFilters = (limit: string) => {
    const params: Record<string, string> = { limit };
    if (name.trim()) params.name = name.trim();
    if (msisdn.trim()) params.msisdn = msisdn.trim();
    if (reason) params.reason = reason;
    if (deregisteredFrom) params.deregistered_from = `${deregisteredFrom}T00:00:00.000`;
    if (deregisteredTo) params.deregistered_to = `${deregisteredTo}T23:59:59.999`;
    return params;
  };

  useEffect(() => {
    setLoading(true);
    const handle = setTimeout(() => {
      listDeregistrations(buildFilters("100"))
        .then((res: any) => {
          setRows(res.data ?? []);
          setTotal(res.total ?? res.data?.length ?? 0);
        })
        .catch((err) => toast({ title: "Error", description: err.message, variant: "destructive" }))
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, msisdn, reason, deregisteredFrom, deregisteredTo]);

  const hasFilters = useMemo(
    () => Boolean(name || msisdn || reason || deregisteredFrom || deregisteredTo),
    [name, msisdn, reason, deregisteredFrom, deregisteredTo]
  );

  const clearFilters = () => {
    setName("");
    setMsisdn("");
    setReason("");
    setDeregisteredFrom("");
    setDeregisteredTo("");
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res: any = await listDeregistrations(buildFilters("5000"));
      downloadCsv("deregistrations.csv", res.data ?? []);
    } catch (err: any) {
      toast({ title: "Export failed", description: err.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold text-slate-900">Deregistrations</h1>
        <span className="ml-2 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600">{total}</span>
        <Button onClick={handleExport} disabled={exporting} variant="outline" size="sm" className="ml-auto gap-1.5">
          <Download className="h-3.5 w-3.5" />
          {exporting ? "Exporting…" : "Export CSV"}
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
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
            <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Deregistered From</Label>
            <Input type="date" value={deregisteredFrom} onChange={(e: any) => setDeregisteredFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Deregistered To</Label>
            <Input type="date" value={deregisteredTo} onChange={(e: any) => setDeregisteredTo(e.target.value)} />
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
          <UserX className="h-10 w-10 mb-3 opacity-40" />
          <span className="text-sm">{hasFilters ? "No deregistrations match your filters" : "No deregistered subscribers"}</span>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">#</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Subscriber</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">MSISDN</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Passport No.</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Nationality</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">ICCID</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Reason</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Operator</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row: any, idx: number) => (
                <TableRow key={row.subscriberId} className="hover:bg-slate-50 transition-colors">
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
                  <TableCell className="font-mono text-sm text-slate-600">{row.subscriber?.simInventory?.iccid ?? "—"}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                      {REASON_LABELS[row.reason] ?? row.reason}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-600 text-sm">{row.operator}</TableCell>
                  <TableCell className="text-slate-500 text-sm">{formatDateTimeEAT(row.deregisteredAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
