import type { ComponentType } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

type KpiVariant = "default" | "primary" | "secondary" | "warning" | "danger";

const ICON_WRAP_CLASSES: Record<KpiVariant, string> = {
  default: "bg-kyc-brand-tint",
  primary: "bg-kyc-brand",
  secondary: "bg-kyc-brand-tint",
  warning: "bg-amber-100",
  danger: "bg-red-100",
};

const ICON_CLASSES: Record<KpiVariant, string> = {
  default: "text-kyc-brand",
  primary: "text-white",
  secondary: "text-kyc-brand",
  warning: "text-kyc-warning",
  danger: "text-kyc-danger",
};

const VALUE_CLASSES: Record<KpiVariant, string> = {
  default: "text-kyc-text-primary",
  primary: "text-kyc-brand",
  secondary: "text-kyc-text-primary",
  warning: "text-kyc-warning",
  danger: "text-kyc-danger",
};

export function KpiCard({
  title,
  value,
  icon: Icon,
  breakdown,
  trend,
  sub,
  highlight,
  variant = "default",
}: {
  title: string;
  value: string | number;
  icon?: ComponentType<{ className?: string }>;
  breakdown?: { active: number; suspended: number; activePct: number; suspendedPct: number };
  trend?: { up: boolean; value: string };
  sub?: string;
  highlight?: boolean;
  /** Visual weight: primary = hero metric, secondary = supporting, warning/danger = operational alert. */
  variant?: KpiVariant;
}) {
  const resolvedVariant: KpiVariant = highlight && variant === "default" ? "danger" : variant;
  return (
    <div
      className={`h-full overflow-hidden rounded-xl border bg-white shadow-card p-3 flex flex-col min-w-0 justify-center ${
        resolvedVariant === "primary" ? "border-kyc-brand/30 bg-kyc-brand-tint/30" : "border-kyc-border"
      } ${resolvedVariant === "danger" ? "ring-1 ring-kyc-danger/30" : ""} ${
        resolvedVariant === "warning" ? "ring-1 ring-kyc-warning/30" : ""
      }`}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        {Icon && (
          <div className={`flex items-center justify-center w-6 h-6 rounded-md flex-shrink-0 ${ICON_WRAP_CLASSES[resolvedVariant]}`}>
            <Icon className={`w-3.5 h-3.5 ${ICON_CLASSES[resolvedVariant]}`} />
          </div>
        )}
        <span className="text-[11px] text-kyc-text-secondary truncate">{title}</span>
      </div>
      <span className={`${resolvedVariant === "primary" ? "text-2xl" : "text-xl"} font-bold tracking-tight ${VALUE_CLASSES[resolvedVariant]}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </span>

      {breakdown ? (
        <div className="mt-2">
          <div className="flex rounded-full overflow-hidden h-1.5 bg-slate-100">
            <div style={{ width: `${breakdown.activePct}%`, backgroundColor: "#16A34A" }} />
            <div style={{ width: `${breakdown.suspendedPct}%`, backgroundColor: "#F59E0B" }} />
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-[10px] flex-wrap">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
              <span className="text-kyc-text-secondary">Active</span>
              <span className="font-semibold text-kyc-text-primary">{breakdown.active}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
              <span className="text-kyc-text-secondary">Susp.</span>
              <span className="font-semibold text-kyc-text-primary">{breakdown.suspended}</span>
            </span>
          </div>
        </div>
      ) : trend ? (
        <div className="mt-1.5 flex items-center gap-1 text-[11px] truncate">
          {trend.up ? <TrendingUp className="w-3 h-3 flex-shrink-0 text-[#16A34A]" /> : <TrendingDown className="w-3 h-3 flex-shrink-0 text-[#DC2626]" />}
          <span className={`flex-shrink-0 ${trend.up ? "text-[#16A34A]" : "text-[#DC2626]"}`}>{trend.value}</span>
        </div>
      ) : sub ? (
        <span className="mt-1.5 text-[10px] text-kyc-text-secondary truncate">{sub}</span>
      ) : null}
    </div>
  );
}
