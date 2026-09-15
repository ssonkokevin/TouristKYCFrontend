import { Component, useMemo, useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import { Input } from "@/components/ui/input";
import { WorldNationalityMap } from "./WorldNationalityMap";
import { NationalityLegend } from "./NationalityLegend";
import { toNationalityRegistrations, type NationalityRow, STATUS_DOT_COLORS, STATUS_LABELS } from "./nationalityData";

// Defensive guard: world GeoJSON is fetched at runtime, so a network or
// parse failure (or an unexpected render error) degrades to a plain list
// rather than a broken/blank map.
class MapErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function FallbackList({ data }: { data: ReturnType<typeof toNationalityRegistrations> }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-kyc-border bg-slate-50 py-6 text-center">
        <span className="text-sm font-medium text-kyc-text-primary">Map data temporarily unavailable</span>
        <span className="text-[13px] text-kyc-text-secondary">Showing the nationality list instead.</span>
      </div>
      <div className="space-y-2">
        {data.map((n) => (
          <div key={n.countryCode} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
            <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: n.color }} />
            <span className="flex-1 truncate text-[15px] font-medium text-kyc-text-primary">
              {n.flagEmoji} {n.countryName}
            </span>
            <span className="text-sm font-semibold text-kyc-text-secondary">{n.registrations.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function NationalityDistribution({ data }: { data: NationalityRow[] }) {
  const registrations = useMemo(() => toNationalityRegistrations(data), [data]);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [focusRequest, setFocusRequest] = useState<{ code: string; token: number } | null>(null);
  const [showAll, setShowAll] = useState(false);

  const totalCountries = registrations.length;
  const totalRegistrations = useMemo(() => registrations.reduce((s, r) => s + r.registrations, 0), [registrations]);

  const focusCountry = (code: string) => {
    setSelectedCode(code);
    setFocusRequest({ code, token: Date.now() });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = search.trim().toLowerCase();
    if (!term) return;
    const match = registrations.find((r) => r.countryName.toLowerCase().includes(term));
    if (match) {
      setSearchError(null);
      focusCountry(match.countryCode);
    } else {
      setSearchError("No registration data available for this country.");
    }
  };

  // Deliberately no early return for `data.length === 0` — the base world
  // map must always render (full frame, default zoom, no highlighted
  // countries) rather than a placeholder graphic. `registrations` below is
  // simply an empty array in that case, and every downstream piece (the
  // map's "unregistered" styling, the legend, the footer counts) already
  // tolerates that without special-casing it.
  return (
    <div className="flex h-full flex-col gap-2" style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      {/* Header row: title/subtitle left, search right — map itself fills the rest of the card */}
      <div className="flex flex-shrink-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[15px] font-semibold text-kyc-text-primary leading-tight">Nationality Distribution</div>
          <div className="text-[12px] text-kyc-text-secondary leading-tight">Border colors represent tourist nationality</div>
        </div>
        <form onSubmit={handleSearch} className="relative w-full max-w-[200px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-kyc-text-secondary" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSearchError(null);
            }}
            placeholder="Search country…"
            className="h-7 pl-8 text-[12px]"
          />
        </form>
      </div>
      {searchError && <p className="flex-shrink-0 text-[12px] text-kyc-danger">{searchError}</p>}

      {/* Map — the hero element, fills the remaining card height */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {showAll ? (
          <div className="h-full overflow-y-auto rounded-lg border border-kyc-border p-3">
            <button type="button" onClick={() => setShowAll(false)} className="mb-2 text-[12px] font-medium text-kyc-brand hover:underline">
              ← Back to map
            </button>
            <NationalityLegend data={registrations} selectedCode={selectedCode} onSelect={focusCountry} limit={registrations.length} />
          </div>
        ) : (
          <MapErrorBoundary fallback={<FallbackList data={registrations} />}>
            <WorldNationalityMap
              data={registrations}
              selectedCode={selectedCode}
              onSelect={setSelectedCode}
              onViewAll={() => setShowAll((v) => !v)}
              focusRequest={focusRequest}
            />
          </MapErrorBoundary>
        )}
      </div>

      {/* One compact footer row: status legend left, totals right */}
      <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-2 border-t border-kyc-border pt-2 text-[12px] text-kyc-text-secondary">
        <span className="flex flex-wrap items-center gap-2.5">
          {(Object.keys(STATUS_LABELS) as (keyof typeof STATUS_LABELS)[]).map((status) => (
            <span key={status} className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full border-2" style={{ borderColor: STATUS_DOT_COLORS[status] }} />
              {STATUS_LABELS[status]}
            </span>
          ))}
        </span>
        <span className="flex items-center gap-3">
          <span>
            Countries: <strong className="font-semibold text-kyc-text-primary">{totalCountries}</strong>
          </span>
          <span>
            Registrations: <strong className="font-semibold text-kyc-text-primary">{totalRegistrations.toLocaleString()}</strong>
          </span>
        </span>
      </div>
    </div>
  );
}
