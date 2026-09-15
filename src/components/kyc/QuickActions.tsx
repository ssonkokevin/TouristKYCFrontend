import { Link } from "react-router-dom";
import { UserPlus, Smartphone, ScanLine, Hash, ChevronRight } from "lucide-react";

const actions = [
  { label: "Register Tourist", desc: "New subscriber", icon: UserPlus, to: "/subscribers", primary: true },
  { label: "SIM Provisioning", desc: "Manage SIM stock", icon: Smartphone, to: "/sim-inventory", primary: false },
  { label: "Passport Scan", desc: "Verify a document", icon: ScanLine, to: "/subscribers/passport-history", primary: false },
];

export function QuickActions({ simAvailable, msisdnAvailable }: { simAvailable?: number; msisdnAvailable?: number }) {
  return (
    <div className="rounded-2xl border border-kyc-border bg-white shadow-card h-full flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-kyc-border">
        <h3 className="text-sm font-semibold text-kyc-text-primary">Quick Actions</h3>
      </div>
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="flex-1 flex flex-col gap-2.5">
          {actions.map((a) => (
            <Link
              key={a.label}
              to={a.to}
              className={`flex items-center gap-3 rounded-xl p-3 transition-all hover:shadow-sm border ${
                a.primary ? "bg-kyc-brand border-kyc-brand" : "bg-white border-kyc-border hover:bg-slate-50"
              }`}
            >
              <div
                className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${
                  a.primary ? "bg-white/20" : "bg-kyc-brand-tint"
                }`}
              >
                <a.icon className={`w-4 h-4 ${a.primary ? "text-white" : "text-kyc-brand"}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold ${a.primary ? "text-white" : "text-kyc-text-primary"}`}>{a.label}</p>
                <p className={`text-[11px] truncate ${a.primary ? "text-white/75" : "text-kyc-text-secondary"}`}>{a.desc}</p>
              </div>
              <ChevronRight className={`h-4 w-4 flex-shrink-0 ${a.primary ? "text-white/60" : "text-kyc-text-secondary"}`} />
            </Link>
          ))}
        </div>

        {(simAvailable !== undefined || msisdnAvailable !== undefined) && (
          <div className="grid grid-cols-2 gap-3 border-t border-kyc-border pt-3">
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-2">
              <Smartphone className="h-3.5 w-3.5 text-kyc-text-secondary flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] text-kyc-text-secondary truncate">Available SIM Stock</div>
                <div className="text-sm font-semibold text-kyc-text-primary">{(simAvailable ?? 0).toLocaleString()}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-2">
              <Hash className="h-3.5 w-3.5 text-kyc-text-secondary flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] text-kyc-text-secondary truncate">Available MSISDN</div>
                <div className="text-sm font-semibold text-kyc-text-primary">{(msisdnAvailable ?? 0).toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
