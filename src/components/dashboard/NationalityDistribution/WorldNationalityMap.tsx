import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import type { NationalityRegistration } from "./nationalityData";
import { MapControls } from "./MapControls";
import { NationalityLegend } from "./NationalityLegend";
import { SelectedCountryCard } from "./SelectedCountryCard";

const WORLD_BOUNDS = L.latLngBounds([-58, -170], [82, 190]);

// Country boundaries live in public/world-countries.geo.json and are
// fetched once at runtime rather than statically imported — a static import
// would inline the ~4MB (50m-resolution) dataset into the main JS bundle.
// Cached at module scope so remounts (e.g. toggling the "view all
// countries" list) don't re-fetch.
let worldCountriesCache: Promise<any> | null = null;
function loadWorldCountries(): Promise<any> {
  if (!worldCountriesCache) {
    worldCountriesCache = fetch("/world-countries.geo.json").then((res) => {
      if (!res.ok) throw new Error(`Failed to load world map data (HTTP ${res.status})`);
      return res.json();
    });
  }
  return worldCountriesCache;
}

interface WorldNationalityMapProps {
  data: NationalityRegistration[];
  selectedCode: string | null;
  onSelect: (code: string | null) => void;
  onViewAll: () => void;
  focusRequest: { code: string; token: number } | null;
}

function styleFor(registration: NationalityRegistration | undefined, isSelected: boolean, isDimmed: boolean) {
  if (!registration) {
    // Non-registered geography stays almost invisible (~8-10% gray) so
    // highlighted countries are the only thing that reads at rest.
    return { fillColor: "#C7CDD6", fillOpacity: 0.08, color: "#C7CDD6", weight: 0.5, opacity: 0.35 };
  }
  return {
    // No interior fill at all for registered countries — the border color
    // alone carries the nationality signal. A big landmass with a complex
    // coastline (Russia, Canada, Australia) must never read as a filled
    // blob, so fillOpacity is hard-zero rather than a faint wash. The
    // stroke itself is the country's full, saturated legend color — no
    // alpha blending — so it stays legible without needing hover.
    fillColor: registration.color,
    fillOpacity: 0,
    color: registration.color,
    weight: isSelected ? 4 : 3,
    opacity: isDimmed ? 0.35 : 1,
  };
}

function applyGlow(layer: L.Path, color: string | null) {
  const el = (layer as any).getElement?.() as SVGElement | undefined;
  if (!el) return;
  // Small, tight blur radius — large enough to read as a soft glow on a
  // border, small enough that dense coastlines (islands, fjords) don't
  // visually merge into a solid color mass.
  el.style.filter = color ? `drop-shadow(0 0 2px ${color}66)` : "";
}

// Explicit, deliberate fade+pan timing for every programmatic zoom (world
// reset, search, legend focus) — 250ms ease-out, matching Leaflet's own
// zoom-animation easing so the motion reads as one continuous transition.
const FLY_OPTIONS = { animate: true, duration: 0.25, easeLinearity: 0.25 } as const;

/** Fits the map to world bounds once on mount and again whenever `resetToken` changes. */
function FitWorld({ resetToken }: { resetToken: number }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(WORLD_BOUNDS, FLY_OPTIONS);
  }, [map, resetToken]);
  return null;
}

/** Imperatively zooms/fits to a country's bounds when a search/legend focus request comes in. */
function FocusOnRequest({
  focusRequest,
  layersByCode,
}: {
  focusRequest: { code: string; token: number } | null;
  layersByCode: Map<string, L.Path>;
}) {
  const map = useMap();
  const lastToken = useRef<number | null>(null);
  useEffect(() => {
    if (!focusRequest || focusRequest.token === lastToken.current) return;
    lastToken.current = focusRequest.token;
    const layer = layersByCode.get(focusRequest.code);
    if (layer && "getBounds" in layer) {
      map.fitBounds((layer as any).getBounds(), { ...FLY_OPTIONS, maxZoom: 5, padding: [24, 24] });
    }
  }, [focusRequest, layersByCode, map]);
  return null;
}

/**
 * Leaflet animates zoom by CSS-transform-scaling the whole SVG pane, then
 * re-rendering crisply once settled. A `filter: drop-shadow(...)` glow on
 * individual paths doesn't scale cleanly under that transform — its blur
 * radius stays fixed in screen pixels while the path scales, which is what
 * produced the "blurred, faceted" mid-zoom frame. Stripping the filter for
 * the duration of the transform (and restoring it once Leaflet redraws at
 * the settled zoom) removes the artifact and leaves a clean fade+pan.
 */
function ZoomFilterGuard({
  layersByCode,
  byCode,
}: {
  layersByCode: Map<string, L.Path>;
  byCode: Map<string, NationalityRegistration>;
}) {
  const map = useMap();
  useEffect(() => {
    const clear = () => layersByCode.forEach((layer) => applyGlow(layer, null));
    const restore = () => layersByCode.forEach((layer, code) => applyGlow(layer, byCode.get(code)?.color ?? null));
    map.on("zoomstart", clear);
    map.on("zoomend", restore);
    return () => {
      map.off("zoomstart", clear);
      map.off("zoomend", restore);
    };
  }, [map, layersByCode, byCode]);
  return null;
}

export function WorldNationalityMap({ data, selectedCode, onSelect, onViewAll, focusRequest }: WorldNationalityMapProps) {
  const byCode = useMemo(() => {
    const map = new Map<string, NationalityRegistration>();
    for (const row of data) map.set(row.countryCode, row);
    return map;
  }, [data]);

  const totalRegistrations = useMemo(() => data.reduce((sum, r) => sum + r.registrations, 0), [data]);
  const layersByCode = useRef(new Map<string, L.Path>()).current;
  const geoJsonRef = useRef<L.GeoJSON | null>(null);
  const [resetToken, setResetToken] = useState(0);
  const [worldCountries, setWorldCountries] = useState<any | null>(null);
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    loadWorldCountries()
      .then(setWorldCountries)
      .catch((err) => setLoadError(err instanceof Error ? err : new Error(String(err))));
  }, []);

  // Re-thrown during render so the MapErrorBoundary already wrapping this
  // component (in NationalityDistribution.tsx) catches it the same way it
  // would catch a synchronous rendering error, and falls back to the plain
  // country list instead of a broken/blank map.
  if (loadError) throw loadError;

  // Re-apply styles/glow to every layer whenever the selection changes,
  // without re-creating the GeoJSON layer (no geometry re-parse, no
  // re-fetch — matches the "load geometry once" performance requirement).
  useEffect(() => {
    layersByCode.forEach((layer, code) => {
      const registration = byCode.get(code);
      const isSelected = selectedCode === code;
      const isDimmed = !!selectedCode && !isSelected && !!registration;
      layer.setStyle(styleFor(registration, isSelected, isDimmed));
      applyGlow(layer, registration ? registration.color : null);
    });
  }, [selectedCode, byCode, layersByCode]);

  const handleReset = () => {
    setResetToken((t) => t + 1);
    onSelect(null);
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg border border-kyc-border" style={{ background: "#F4F7F8" }}>
      <MapContainer
        style={{ height: "100%", width: "100%", background: "#F4F7F8" }}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={false}
        minZoom={1}
        maxZoom={7}
      >
        <FitWorld resetToken={resetToken} />
        <FocusOnRequest focusRequest={focusRequest} layersByCode={layersByCode} />
        <ZoomFilterGuard layersByCode={layersByCode} byCode={byCode} />
        <MapControls onReset={handleReset} />
        {!worldCountries ? (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-[#F4F7F8]/80 text-[13px] text-kyc-text-secondary">
            Loading map…
          </div>
        ) : (
          <GeoJSON
            key={data.map((r) => r.countryCode).join(",")}
            ref={geoJsonRef as any}
            data={worldCountries}
            style={(feature: any) => styleFor(byCode.get(feature?.id), selectedCode === feature?.id, false)}
            onEachFeature={(feature, layer) => {
              const code = feature.id as string;
              const registration = byCode.get(code);
              layersByCode.set(code, layer as L.Path);

              if (!registration) return;

              layer.bindTooltip(
                `<div class="font-semibold">${registration.flagEmoji ?? ""} ${registration.countryName}</div>` +
                  `<div class="mt-0.5 text-slate-600">${registration.registrations.toLocaleString()} Registration${
                    registration.registrations === 1 ? "" : "s"
                  }</div>`,
                { className: "kyc-map-tooltip", sticky: true, direction: "top" }
              );

              layer.on("add", () => applyGlow(layer as L.Path, registration.color));
              layer.on("mouseover", () => {
                (layer as L.Path).setStyle({ weight: 4 });
                applyGlow(layer as L.Path, registration.color);
              });
              layer.on("mouseout", () => {
                const isSelected = selectedCode === code;
                (layer as L.Path).setStyle({ weight: isSelected ? 4 : 3 });
              });
              layer.on("click", () => onSelect(selectedCode === code ? null : code));
            }}
          />
        )}
      </MapContainer>

      <div className="absolute bottom-2 left-2 z-[800]">
        <NationalityLegend data={data} selectedCode={selectedCode} onSelect={(code) => onSelect(code)} onViewAll={onViewAll} overlay />
      </div>

      <SelectedCountryCard
        registration={selectedCode ? byCode.get(selectedCode) ?? null : null}
        totalRegistrations={totalRegistrations}
        onClose={() => onSelect(null)}
      />
    </div>
  );
}
