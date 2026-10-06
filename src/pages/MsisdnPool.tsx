import { useState, useEffect, useMemo } from "react";
import { listMsisdnPool, releaseHeldMsisdn } from "@/api/client";
import { useToast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Phone, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/kyc/PageHeader";

const MSISDN_STATUS: Record<string, string> = {
  available: "bg-kyc-brand-tint text-kyc-brand",
  reserved: "bg-kyc-info-tint text-kyc-info",
  active: "bg-kyc-brand-tint text-kyc-brand",
  suspended: "bg-amber-100 text-amber-700",
  held: "bg-orange-100 text-orange-700",
  deactivated: "bg-slate-100 text-slate-500",
};

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-kyc-border bg-white shadow-card p-4">
      <div className="text-2xl font-bold text-kyc-text-primary">{value.toLocaleString()}</div>
      <div className="mt-0.5 text-xs font-medium text-kyc-text-secondary">{label}</div>
    </div>
  );
}

export function MsisdnPoolPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const { toast } = useToast();

  const loadRows = () => {
    setLoading(true);
    listMsisdnPool({ limit: "100" })
      .then((res) => setRows(res.data ?? []))
      .catch((err) => toast({ title: "Error", description: err.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRows();
  }, [toast]);

  const filtered = useMemo(
    () => rows.filter((r: any) => !search || r.msisdn?.toLowerCase().includes(search.toLowerCase())),
    [rows, search]
  );

  const availableCount = rows.filter((r: any) => r.status === "available").length;
  const activeCount = rows.filter((r: any) => r.status === "active").length;
  const heldCount = rows.filter((r: any) => r.status === "held").length;

  const handleReleaseHeld = async (id: string) => {
    const target = rows.find((row) => row.id === id);
    if (!target) return;

    const confirmed = window.confirm(`Release ${target.msisdn} back to the MSISDN pool?`);
    if (!confirmed) return;

    setReleasingId(id);
    try {
      await releaseHeldMsisdn(id);
      toast({ title: "MSISDN released", description: `${target.msisdn} is available again.` });
      loadRows();
    } catch (err: any) {
      toast({ title: "Release failed", description: err.message, variant: "destructive" });
    } finally {
      setReleasingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="MSISDN Pool" subtitle="Manage the pool of available numbers." count={rows.length} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="Total Numbers" value={rows.length} />
        <StatTile label="Available" value={availableCount} />
        <StatTile label="Active" value={activeCount} />
        <StatTile label="Held" value={heldCount} />
      </div>

      <Input placeholder="Search by MSISDN" value={search} onChange={(e: any) => setSearch(e.target.value)} className="max-w-sm" />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Phone className="h-10 w-10 mb-3 opacity-40" />
          <span className="text-sm">No MSISDN numbers in pool</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Phone className="h-10 w-10 mb-3 opacity-40" />
          <span className="text-sm">No numbers match your search</span>
        </div>
      ) : (
        <div className="rounded-2xl border border-kyc-border bg-white shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">MSISDN</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Category</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Status</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Subscriber</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item: any) => (
                <TableRow key={item.id} className="hover:bg-kyc-brand-tint/40 transition-colors">
                  <TableCell className="font-mono text-sm font-medium text-slate-900">{item.msisdn}</TableCell>
                  <TableCell className="text-slate-600 capitalize">{item.category}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${MSISDN_STATUS[item.status] ?? "bg-slate-100 text-slate-500"}`}>
                      {item.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">{item.subscriber?.surname ?? item.reservedBy ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    {item.status === "held" ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => handleReleaseHeld(item.id)}
                        disabled={releasingId === item.id}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        {releasingId === item.id ? "Releasing..." : "Release"}
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
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
