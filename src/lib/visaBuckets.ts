// Shared Today/Tomorrow/2-3 days/4-7 days grouping used by both the
// Dashboard's Visa Expiry card and the Reports "Visas" tab, so the two never
// drift apart on how the 7-day breakdown is merged into 4 friendly tiles.
export interface VisaDayBucket {
  label: string;
  expiring: number;
  active: number;
}

export interface VisaExpiryTile {
  label: string;
  value: number;
}

/** Expects the 7 daily buckets returned by `getVisaExpiryAlerts("7d")`, in
 * order starting today. Falls back to an empty tile set if the input isn't
 * exactly 7 days (e.g. still loading, or a longer range was passed by
 * mistake) rather than silently mis-merging the wrong buckets. */
export function toExpiryTiles(days: VisaDayBucket[]): VisaExpiryTile[] {
  if (days.length !== 7) return [];
  const at = (i: number) => days[i]?.expiring ?? 0;
  return [
    { label: "Today", value: at(0) },
    { label: "Tomorrow", value: at(1) },
    { label: "2–3 days", value: at(2) + at(3) },
    { label: "4–7 days", value: at(4) + at(5) + at(6) },
  ];
}
