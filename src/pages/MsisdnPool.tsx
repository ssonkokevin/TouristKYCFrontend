import { useState, useEffect, useMemo } from "react";
import { listMsisdnPool } from "@/api/client";
import { useToast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Phone } from "lucide-react";

const MSISDN_STATUS: Record<string, string> = {
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

export function MsisdnPoolPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    listMsisdnPool({ limit: "100" })
      .then((res) => setRows(res.data ?? []))
      .catch((err) => toast({ title: "Error", description: err.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [toast]);

  const filtered = useMemo(
    () => rows.filter((r: any) => !search || r.msisdn?.toLowerCase().includes(search.toLowerCase())),
    [rows, search]
  );

  const availableCount = rows.filter((r: any) => r.status === "available").length;
  const activeCount = rows.filter((r: any) => r.status === "active").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold text-slate-900">MSISDN Pool</h1>
        <span className="ml-2 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-600">{rows.length}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KpiCard label="Total Numbers" value={rows.length} />
        <KpiCard label="Available" value={availableCount} />
        <KpiCard label="Active" value={activeCount} />
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
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">MSISDN</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Category</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Status</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Subscriber</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item: any) => (
                <TableRow key={item.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="font-mono text-sm font-medium text-slate-900">{item.msisdn}</TableCell>
                  <TableCell className="text-slate-600 capitalize">{item.category}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${MSISDN_STATUS[item.status] ?? "bg-slate-100 text-slate-500"}`}>
                      {item.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">{item.subscriber?.surname ?? item.reservedBy ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
