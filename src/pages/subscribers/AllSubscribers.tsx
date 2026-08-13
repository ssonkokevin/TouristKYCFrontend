import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { listSubscribers } from "@/api/client";
import { useToast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Users, Download, X } from "lucide-react";
import { formatDateTimeEAT, formatDateEAT } from "@/lib/formatDate";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-kyc-brand-tint text-kyc-brand",
  suspended: "bg-kyc-warning-tint text-kyc-warning",
  deregistered: "bg-kyc-danger-tint text-kyc-danger",
};

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "deregistered", label: "Deregistered" },
];

function csvText(value: string) {
  // Force Excel to treat numeric-looking strings (passport no., MSISDN, IMSI, ICCID)
  // as text instead of converting to scientific notation / stripping leading zeros.
  return `="${(value ?? "").replace(/"/g, '""')}"`;
}

function toCsv(rows: any[]) {
  const header = "Name,Gender,Passport,Nationality,Visa Type,Visa Expiry,MSISDN,IMSI,ICCID,Status,Registered At (EAT)\n";
  const body = rows
    .map((r) =>
      [
        `"${(r.surname ?? "") + " " + (r.otherNames ?? "")}"`,
        r.gender ?? "",
        csvText(r.passportNumber),
        r.nationality?.name ?? r.nationalityCode ?? "",
        r.visaType ?? "",
        formatDateEAT(r.visaExpiryDate),
        csvText(r.msisdnPool?.[0]?.msisdn),
        csvText(r.simInventory?.imsi),
        csvText(r.simInventory?.iccid),
        r.status ?? "",
        formatDateTimeEAT(r.registeredAt),
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

export function AllSubscribersPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [name, setName] = useState("");
  const [msisdn, setMsisdn] = useState("");
  const [status, setStatus] = useState("");
  const [registeredFrom, setRegisteredFrom] = useState("");
  const [registeredTo, setRegisteredTo] = useState("");

  const { toast } = useToast();
  const navigate = useNavigate();

  const buildFilters = (limit: string) => {
    const params: Record<string, string> = { limit };
    if (name.trim()) params.name = name.trim();
    if (msisdn.trim()) params.msisdn = msisdn.trim();
    if (status) params.status = status;
    if (registeredFrom) params.registered_from = `${registeredFrom}T00:00:00.000`;
    if (registeredTo) params.registered_to = `${registeredTo}T23:59:59.999`;
    return params;
  };

  useEffect(() => {
    setLoading(true);
    const handle = setTimeout(() => {
      listSubscribers(buildFilters("100"))
        .then((res: any) => {
          setRows(res.data ?? []);
          setTotal(res.total ?? res.data?.length ?? 0);
        })
        .catch((err) => toast({ title: "Error", description: err.message, variant: "destructive" }))
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, msisdn, status, registeredFrom, registeredTo]);

  const hasFilters = useMemo(
    () => Boolean(name || msisdn || status || registeredFrom || registeredTo),
    [name, msisdn, status, registeredFrom, registeredTo]
  );

  const clearFilters = () => {
    setName("");
    setMsisdn("");
    setStatus("");
    setRegisteredFrom("");
    setRegisteredTo("");
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res: any = await listSubscribers(buildFilters("5000"));
      downloadCsv("subscribers.csv", res.data ?? []);
    } catch (err: any) {
      toast({ title: "Export failed", description: err.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold text-kyc-text-primary">All Subscribers</h1>
        <span className="ml-2 rounded-full bg-kyc-brand-tint px-2.5 py-0.5 text-xs font-medium text-kyc-brand">{total}</span>
        <Button
          onClick={handleExport}
          disabled={exporting}
          variant="outline"
          size="sm"
          className="ml-auto gap-1.5"
        >
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
            <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Status</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Registered From</Label>
            <Input type="date" value={registeredFrom} onChange={(e: any) => setRegisteredFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Registered To</Label>
            <Input type="date" value={registeredTo} onChange={(e: any) => setRegisteredTo(e.target.value)} />
          </div>
        </div>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
          >
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
          <Users className="h-10 w-10 mb-3 opacity-40" />
          <span className="text-sm">{hasFilters ? "No subscribers match your filters" : "No subscribers yet"}</span>
        </div>
      ) : (
        <div className="bg-white rounded-card shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Name</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Passport</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Nationality</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">MSISDN</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Registered</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((sub: any) => (
                <TableRow
                  key={sub.id}
                  className="hover:bg-kyc-brand-tint/40 transition-colors cursor-pointer"
                  onClick={() => navigate(`/subscribers/${sub.id}`)}
                >
                  <TableCell className="font-medium text-slate-900">{sub.surname} {sub.otherNames}</TableCell>
                  <TableCell className="text-slate-600 font-mono text-sm">{sub.passportNumber}</TableCell>
                  <TableCell className="text-slate-600">{sub.nationality?.name ?? sub.nationalityCode}</TableCell>
                  <TableCell className="text-slate-600 font-mono text-sm">{sub.msisdnPool?.[0]?.msisdn ?? "—"}</TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {formatDateEAT(sub.registeredAt) || "—"}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[sub.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {sub.status}
                    </span>
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
