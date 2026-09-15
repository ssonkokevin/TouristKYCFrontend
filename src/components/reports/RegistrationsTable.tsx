import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { listSubscribers, exportRegistrationsCsv } from "@/api/client";
import { useToast } from "@/components/ui/use-toast";
import { formatDateEAT } from "@/lib/formatDate";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-kyc-brand-tint text-kyc-brand",
  suspended: "bg-kyc-warning-tint text-kyc-warning",
  deregistered: "bg-kyc-danger-tint text-kyc-danger",
};

function statusPill(row: any): { label: string; className: string } {
  if (row.status === "suspended" && row.suspension?.suspendedAt) {
    return { label: `Suspended · ${formatDateEAT(row.suspension.suspendedAt)}`, className: STATUS_COLORS.suspended };
  }
  if (row.status === "deregistered" && row.deregistration?.deregisteredAt) {
    return { label: `Deregistered · ${formatDateEAT(row.deregistration.deregisteredAt)}`, className: STATUS_COLORS.deregistered };
  }
  return { label: row.status === "active" ? "Active" : row.status, className: STATUS_COLORS[row.status] ?? "" };
}

const PAGE_SIZE = 20;

export function RegistrationsTable({ from, to }: { from?: string; to?: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => setPage(1), [from, to]);

  useEffect(() => {
    setLoading(true);
    listSubscribers({
      page: String(page),
      limit: String(PAGE_SIZE),
      sort_by: "registeredAt",
      sort_dir: "desc",
      ...(from ? { registered_from: from } : {}),
      ...(to ? { registered_to: to } : {}),
    })
      .then((res) => {
        setRows((res as any).data ?? []);
        setTotal((res as any).total ?? 0);
      })
      .catch((err) => toast({ title: "Error loading registrations", description: err.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [page, from, to, toast]);

  const handleExport = () => {
    setExporting(true);
    exportRegistrationsCsv(from, to)
      .catch((err) => toast({ title: "Export failed", description: err.message, variant: "destructive" }))
      .finally(() => setExporting(false));
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="rounded-2xl border border-kyc-border bg-white shadow-card flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-kyc-border">
        <div>
          <h3 className="text-sm font-semibold text-kyc-text-primary">Registrations</h3>
          <p className="text-[11px] text-kyc-text-secondary">{total.toLocaleString()} records in the selected range</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-md text-xs font-medium border border-kyc-border text-kyc-text-primary hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" /> {exporting ? "Exporting…" : "Export CSV"}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-4 border-slate-200 border-t-kyc-brand rounded-full animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="px-4 py-12 text-center text-sm text-kyc-text-secondary">No registrations for the selected range</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] text-kyc-text-secondary border-b border-kyc-border">
                {["Surname", "Given name(s)", "Sex", "ID type", "Passport number", "Visa expiry date", "SIM type", "MSISDN", "Date of registration", "Verified by", "Status"].map((h) => (
                  <th key={h} className="px-3 py-2 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const pill = statusPill(r);
                return (
                  <tr
                    key={r.id}
                    className="border-b border-kyc-border last:border-0 cursor-pointer hover:bg-slate-50"
                    onClick={() => navigate(`/subscribers/${r.id}`)}
                  >
                    <td className="px-3 py-2.5 whitespace-nowrap text-kyc-text-primary font-medium">{r.surname}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-kyc-text-secondary">{r.otherNames}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-kyc-text-secondary capitalize">{r.gender ?? "—"}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-kyc-text-secondary capitalize">{r.idType ?? "—"}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-kyc-text-secondary">{r.passportNumber}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-kyc-text-secondary">{formatDateEAT(r.visaExpiryDate) || "—"}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-kyc-text-secondary uppercase">{r.simInventory?.type ?? "—"}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-kyc-text-secondary">{r.msisdnPool?.[0]?.msisdn ?? "—"}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-kyc-text-secondary">{formatDateEAT(r.registeredAt) || "—"}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-kyc-text-secondary">{r.registeredBy ?? "—"}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${pill.className}`}>{pill.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between px-4 py-3 border-t border-kyc-border">
        <span className="text-[11px] text-kyc-text-secondary">
          Page {page} of {totalPages}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-kyc-border text-kyc-text-secondary hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-kyc-border text-kyc-text-secondary hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
