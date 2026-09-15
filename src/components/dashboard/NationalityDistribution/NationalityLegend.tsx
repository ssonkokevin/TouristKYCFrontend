import type { NationalityRegistration } from "./nationalityData";

interface NationalityLegendProps {
  data: NationalityRegistration[];
  selectedCode: string | null;
  onSelect: (countryCode: string) => void;
  limit?: number;
  onViewAll?: () => void;
  /** Compact floating-overlay styling for placement inside the map. */
  overlay?: boolean;
}

export function NationalityLegend({ data, selectedCode, onSelect, limit = 5, onViewAll, overlay }: NationalityLegendProps) {
  const sorted = [...data].sort((a, b) => b.registrations - a.registrations);
  const shown = sorted.slice(0, limit);

  return (
    <div
      className={
        overlay
          ? "w-[190px] rounded-xl border border-kyc-border bg-white/95 p-2.5 shadow-lg backdrop-blur-sm"
          : "space-y-2"
      }
    >
      <div className="px-0.5 text-[11px] font-semibold uppercase tracking-wide text-kyc-text-secondary">
        Top Nationalities
      </div>
      <div className="mt-1 space-y-0.5">
        {shown.length === 0 && (
          <div className="px-1.5 py-1 text-[12px] text-kyc-text-secondary">No registrations yet</div>
        )}
        {shown.map((n) => (
          <button
            key={n.countryCode}
            type="button"
            onClick={() => onSelect(n.countryCode)}
            className={`flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors ${
              selectedCode === n.countryCode ? "bg-kyc-brand-tint" : "hover:bg-slate-50"
            }`}
          >
            <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: n.color }} />
            <span className="flex-1 truncate text-[13px] font-medium text-kyc-text-primary">{n.countryName}</span>
            <span className="text-[13px] font-semibold text-kyc-text-secondary">{n.registrations.toLocaleString()}</span>
          </button>
        ))}
      </div>
      {sorted.length > limit && onViewAll && (
        <button type="button" onClick={onViewAll} className="mt-1 px-1.5 text-[12px] font-medium text-kyc-brand hover:underline">
          View all countries →
        </button>
      )}
    </div>
  );
}
