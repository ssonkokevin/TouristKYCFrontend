import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, AlertTriangle, FileSearch } from "lucide-react";
import { getPassportHistory } from "@/api/client";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const RECENT_KEY = "passport_history_recent_searches";

function getRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

function pushRecent(value: string) {
  const existing = getRecent().filter((v) => v !== value);
  const updated = [value, ...existing].slice(0, 8);
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
}

export function PassportHistoryPage() {
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    setRecent(getRecent());
  }, []);

  const search = async (passportNumber: string) => {
    if (!passportNumber.trim()) return;
    setLoading(true);
    setShowRecent(false);
    try {
      const res = await getPassportHistory(passportNumber.trim());
      setResult(res);
      pushRecent(passportNumber.trim());
      setRecent(getRecent());
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-kyc-text-primary">Passport History</h1>
      <p className="text-sm text-slate-500">
        Look up every SIM ever registered under a passport number. Tourists are limited to 10 SIM registrations per passport.
      </p>

      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="e.g. ABC123456"
              value={query}
              onChange={(e: any) => setQuery(e.target.value)}
              onFocus={() => setShowRecent(true)}
              onKeyDown={(e: any) => e.key === "Enter" && search(query)}
              className="pl-9"
            />
            {showRecent && recent.length > 0 && !result && (
              <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
                {recent
                  .filter((r) => r.toLowerCase().includes(query.toLowerCase()))
                  .map((r) => (
                    <button
                      key={r}
                      onMouseDown={() => {
                        setQuery(r);
                        search(r);
                      }}
                      className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      {r}
                    </button>
                  ))}
              </div>
            )}
          </div>
          <Button onClick={() => search(query)} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
            {loading ? "Searching..." : "Search"}
          </Button>
        </div>
      </div>

      {result && (
        <div className="space-y-4">
          <div
            className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
              result.at_limit
                ? "border-red-200 bg-red-50 text-red-800"
                : result.total_sims_registered >= 8
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-slate-200 bg-slate-50 text-slate-700"
            }`}
          >
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>
              Passport <span className="font-mono font-semibold">{result.passport_number}</span> —{" "}
              {result.total_sims_registered} of {result.limit} SIMs registered
              {result.remaining >= 0 && ` (${result.remaining} remaining)`}
              {result.at_limit && " — LIMIT REACHED, new registrations blocked"}
            </span>
          </div>

          {result.records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <FileSearch className="h-10 w-10 mb-3 opacity-40" />
              <span className="text-sm">No records found for this passport</span>
            </div>
          ) : (
            <div className="bg-white rounded-card shadow-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Name</TableHead>
                    <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">MSISDN</TableHead>
                    <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">ICCID</TableHead>
                    <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Status</TableHead>
                    <TableHead className="text-xs font-medium text-slate-500 uppercase tracking-wide">Registered</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.records.map((r: any) => (
                    <TableRow
                      key={r.subscriber_id}
                      className="hover:bg-kyc-brand-tint/40 transition-colors cursor-pointer"
                      onClick={() => navigate(`/subscribers/${r.subscriber_id}`)}
                    >
                      <TableCell className="font-medium text-slate-900">{r.name}</TableCell>
                      <TableCell className="font-mono text-sm text-slate-600">{r.msisdn ?? "—"}</TableCell>
                      <TableCell className="font-mono text-sm text-slate-600">{r.iccid ?? "—"}</TableCell>
                      <TableCell className="capitalize text-slate-600">{r.status}</TableCell>
                      <TableCell className="text-slate-500 text-sm">{new Date(r.registered_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
