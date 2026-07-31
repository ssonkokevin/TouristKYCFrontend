import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface Reason {
  value: string;
  label: string;
}

interface ActionModalProps {
  title: string;
  reasons: Reason[];
  confirmLabel: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: (reason: string, note?: string) => void;
}

export function ActionModal({ title, reasons, confirmLabel, destructive, onCancel, onConfirm }: ActionModalProps) {
  const [reason, setReason] = useState(reasons[0]?.value ?? "");
  const [note, setNote] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg">
        <h2 className="text-base font-semibold text-slate-900 mb-4">{title}</h2>

        <div className="space-y-1.5 mb-4">
          <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Reason</Label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {reasons.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5 mb-5">
          <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Note (optional)</Label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant={destructive ? "destructive" : "default"}
            className={!destructive ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            onClick={() => onConfirm(reason, note || undefined)}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
