import { motion, AnimatePresence } from "framer-motion";
import type { NationalityRegistration } from "./nationalityData";
import { STATUS_DOT_COLORS, STATUS_LABELS } from "./nationalityData";

interface SelectedCountryCardProps {
  registration: NationalityRegistration | null;
  totalRegistrations: number;
  onClose: () => void;
}

// Persistent floating panel shown top-right inside the map once a country is
// clicked — replaces the old cursor-following tooltip for the selected state.
// Hover still uses Leaflet's own bindTooltip (styled via .kyc-map-tooltip).
export function SelectedCountryCard({ registration, totalRegistrations, onClose }: SelectedCountryCardProps) {
  const share =
    registration && totalRegistrations > 0
      ? Math.round((registration.registrations / totalRegistrations) * 1000) / 10
      : 0;

  return (
    <AnimatePresence>
      {registration && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="absolute right-2 top-2 z-[800] w-52 max-h-[calc(100%-1rem)] overflow-y-auto rounded-xl border border-kyc-border bg-white p-3 shadow-lg"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="text-[15px] font-semibold text-kyc-text-primary">
              {registration.flagEmoji} {registration.countryName}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-kyc-text-secondary hover:bg-slate-100"
              title="Close"
            >
              ×
            </button>
          </div>
          <div className="mt-1.5 text-sm font-semibold text-kyc-text-primary">
            {registration.registrations.toLocaleString()} Registration{registration.registrations === 1 ? "" : "s"}
          </div>
          <div className="mt-1 text-[13px] text-kyc-text-secondary">{share}% of tourists</div>
          <div className="mt-2 flex items-center gap-1.5 text-[13px]">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_DOT_COLORS[registration.status] }} />
            <span className="text-kyc-text-secondary">Status</span>
            <span className="font-medium text-kyc-text-primary">{STATUS_LABELS[registration.status]}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
