import { useState, useEffect } from "react";
import { listSubscribers } from "@/api/client";
import { useToast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  suspended: "bg-amber-100 text-amber-700",
  deregistered: "bg-red-100 text-red-700",
};

export function SubscribersPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    listSubscribers({ limit: "100" })
      .then((res) => setRows(res.data ?? []))
      .catch((err) => toast({ title: "Error", description: err.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [toast]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold text-slate-900">Subscribers</h1>
        <span className="ml-2 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">{rows.length}</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Users className="h-10 w-10 mb-3 opacity-40" />
          <span className="text-sm">No subscribers yet</span>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Name</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Passport</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Nationality</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">MSISDN</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((sub: any) => (
                <TableRow key={sub.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="font-medium text-slate-900">{sub.surname} {sub.otherNames}</TableCell>
                  <TableCell className="text-slate-600 font-mono text-sm">{sub.passportNumber}</TableCell>
                  <TableCell className="text-slate-600">{sub.nationality?.name ?? sub.nationalityCode}</TableCell>
                  <TableCell className="text-slate-600 font-mono text-sm">{sub.msisdnPool?.[0]?.msisdn ?? "—"}</TableCell>
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
