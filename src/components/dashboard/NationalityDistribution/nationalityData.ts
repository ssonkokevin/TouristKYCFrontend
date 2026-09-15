// Maps the raw nationality rows coming from the dashboard API into the
// shape the border-map, legend, and tooltip need. Kept separate from the
// rendering components so a future real "top nationalities" endpoint can
// replace the mock/derived fields here without touching the map at all.

// Existing app chart palette (also used in Reports.tsx / the old map) —
// reused here instead of introducing a new color system, so the map stays
// visually consistent with the rest of the dashboard.
export const CHART_PALETTE = [
  "#8A4B2F",
  "#3B82F6",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F97316",
];

export type NationalityStatus = "active" | "mixed" | "suspended" | "visa-expiring";

export interface NationalityRow {
  code: string;
  code3: string | null;
  name: string;
  flagEmoji: string;
  count: number;
  activeCount?: number;
  suspendedCount?: number;
  expiringSoonCount?: number;
  recentCount?: number;
}

export interface NationalityRegistration {
  countryCode: string; // ISO3 — matches geojson feature.id
  countryName: string;
  registrations: number;
  color: string;
  status: NationalityStatus;
  flagEmoji: string;
}

// Fixed border colors for the nationalities called out by name in the
// product spec. Anything not in this map falls back to the rank-based
// CHART_PALETTE below, so arbitrary real-world nationality data (100+
// possible countries) still gets a sensible, non-hardcoded color.
const FIXED_COUNTRY_COLORS: Record<string, string> = {
  UGA: "#EF4444", // Uganda
  CHN: "#9B4F2F", // China
  IND: "#3B82F6", // India
  KEN: "#F59E0B", // Kenya
  DEU: "#65A30D", // Germany — kept distinct from Uganda's red so the two never collide on-map
  USA: "#8B5CF6", // United States
  JPN: "#EC4899", // Japan
  FRA: "#14B8A6", // France
  GBR: "#F97316", // United Kingdom
};

function statusFor(row: NationalityRow): NationalityStatus {
  if ((row.expiringSoonCount ?? 0) > 0) return "visa-expiring";
  const count = row.count || 0;
  const suspended = row.suspendedCount ?? 0;
  if (count === 0) return "active";
  const ratio = suspended / count;
  if (ratio <= 0.15) return "active";
  if (ratio >= 0.6) return "suspended";
  return "mixed";
}

/**
 * Converts raw NationalityRow[] (as returned by the dashboard API, sorted by
 * `count` descending) into NationalityRegistration[], assigning each entry a
 * color from the shared chart palette by rank so the sequence stays
 * consistent with charts elsewhere in the app rather than hardcoding colors
 * per country identity (which wouldn't scale to arbitrary real-world data).
 */
export function toNationalityRegistrations(rows: NationalityRow[]): NationalityRegistration[] {
  return rows
    .filter((r) => !!r.code3 && (r.count ?? 0) > 0)
    .map((row, idx) => ({
      countryCode: row.code3 as string,
      countryName: row.name,
      registrations: row.count,
      color: FIXED_COUNTRY_COLORS[row.code3 as string] ?? CHART_PALETTE[idx % CHART_PALETTE.length],
      status: statusFor(row),
      flagEmoji: row.flagEmoji,
    }));
}

export const STATUS_LABELS: Record<NationalityStatus, string> = {
  active: "Mostly active",
  mixed: "Mixed",
  suspended: "Mostly suspended",
  "visa-expiring": "Visa expiring ≤7d",
};

export const STATUS_DOT_COLORS: Record<NationalityStatus, string> = {
  active: "#16A34A",
  mixed: "#F59E0B",
  suspended: "#EF4444",
  "visa-expiring": "#EF4444",
};
