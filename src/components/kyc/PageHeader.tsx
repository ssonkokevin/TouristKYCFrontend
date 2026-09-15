import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  count,
  countTone = "brand",
  children,
}: {
  title: string;
  subtitle?: string;
  count?: number;
  countTone?: "brand" | "warning" | "danger";
  children?: ReactNode;
}) {
  const toneClass =
    countTone === "warning"
      ? "bg-kyc-warning-tint text-kyc-warning"
      : countTone === "danger"
      ? "bg-kyc-danger-tint text-kyc-danger"
      : "bg-kyc-brand-tint text-kyc-brand";

  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-2">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-kyc-text-primary">{title}</h1>
          {count !== undefined && (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${toneClass}`}>{count}</span>
          )}
        </div>
        {subtitle && <p className="text-sm text-kyc-text-secondary mt-1">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
