import { useState, useEffect, useMemo } from "react";
import { listSimInventory } from "@/api/client";
import { getMetrics } from "@/api/client";
import { useToast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Smartphone } from "lucide-react";

const SIM_STATUS: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-700",
  reserved: "bg-blue-100 text-blue-700",
  active: "bg-violet-100 text-violet-700",
  deactivated: "bg-slate-100 text-slate-500",
};

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="text-xl font-bold text-slate-900">{value.toLocaleString()}</div>
      <div className="mt-0.5 text-xs font-medium text-slate-500">{label}</div>
    </div>
  );
}

export function SimInventoryPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [iccidSearch, setIccidSearch] = useState("");
  const [imsiSearch, setImsiSearch] = useState("");
  const [msisdnSearch, setMsisdnSearch] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([listSimInventory({ limit: "100" }), getMetrics()])
      .then(([sims, m]) => {
        setRows(sims.data ?? []);
        setMetrics(m);
      })
      .catch((err) => toast({ title: "Error", description: err.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [toast]);

  const filtered = useMemo(() => {
    return rows.filter((r: any) => {
      if (iccidSearch && !r.iccid?.toLowerCase().includes(iccidSearch.toLowerCase())) return false;
      if (imsiSearch && !r.imsi?.toLowerCase().includes(imsiSearch.toLowerCase())) return false;
      if (msisdnSearch && !r.msisdnPool?.msisdn?.toLowerCase().includes(msisdnSearch.toLowerCase())) return false;
      return true;
    });
  }, [rows, iccidSearch, imsiSearch, msisdnSearch]);

  const assignedCount = rows.filter((r: any) => r.status === "assigned" || r.status === "active").length;
  const availableCount = rows.filter((r: any) => r.status === "available").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold text-slate-900">SIM Inventory</h1>
        <span className="ml-2 rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-600">{rows.length}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total SIMs" value={rows.length} />
        <KpiCard label="Assigned" value={assignedCount} />
        <KpiCard label="Available" value={availableCount} />
        <KpiCard label="Total Numbers" value={metrics?.sim_stock_available + metrics?.sim_stock_assigned || 0} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input placeholder="Search by ICCID" value={iccidSearch} onChange={(e: any) => setIccidSearch(e.target.value)} />
        <Input placeholder="Search by IMSI" value={imsiSearch} onChange={(e: any) => setImsiSearch(e.target.value)} />
        <Input placeholder="Search by MSISDN" value={msisdnSearch} onChange={(e: any) => setMsisdnSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Smartphone className="h-10 w-10 mb-3 opacity-40" />
          <span className="text-sm">No SIM cards in inventory</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Smartphone className="h-10 w-10 mb-3 opacity-40" />
          <span className="text-sm">No SIM cards match your search</span>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">IMSI</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">ICCID</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">MSISDN</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Type</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Category</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((sim: any) => (
                <TableRow key={sim.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="font-mono text-sm text-slate-900">{sim.imsi}</TableCell>
                  <TableCell className="font-mono text-sm text-slate-600">{sim.iccid}</TableCell>
                  <TableCell className="font-mono text-sm text-slate-600">{sim.msisdnPool?.msisdn ?? "—"}</TableCell>
                  <TableCell className="text-slate-600 capitalize">{sim.type}</TableCell>
                  <TableCell className="text-slate-600 capitalize">{sim.category}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${SIM_STATUS[sim.status] ?? "bg-slate-100 text-slate-500"}`}>
                      {sim.status}
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
