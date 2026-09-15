// One-off conversion script — NOT part of the app build. Converts
// world-atlas's countries-50m TopoJSON (Natural Earth 1:50m scale, much
// smoother coastlines than the previous 110m-equivalent asset) into the
// exact GeoJSON FeatureCollection shape the app already consumes, remapping
// world-atlas's numeric ISO 3166-1 `id`s to the alpha-3 codes
// `WorldNationalityMap.tsx` / `nationalityData.ts` already match on, so no
// application code needs to change — only the underlying asset file.
//
// Run once with: node scripts/build-world-geojson.cjs
// Requires (dev-only, not runtime deps): world-atlas, topojson-client, i18n-iso-countries.
const fs = require("fs");
const path = require("path");
const topojson = require("topojson-client");
const countries = require("i18n-iso-countries");
const topo = require("world-atlas/countries-50m.json");

const geo = topojson.feature(topo, topo.objects.countries);

// Natural Earth's raw coastline rings for countries whose territory straddles
// the antimeridian (Russia's Far East, Fiji) aren't cut at ±180° — a ring can
// contain a point at +179.9° immediately followed by one at -180°. Leaflet
// has no built-in dateline clipping, so it draws that as one straight edge
// connecting the two, i.e. a line spanning almost the entire map width. Fix
// by unwrapping each ring's longitudes with a running offset: whenever two
// consecutive points jump by more than 180°, that's the seam, so shift every
// point afterward by ∓360° to keep the ring spatially contiguous instead of
// wrapping. The map's own WORLD_BOUNDS already extends to lng 190 to make
// room for exactly this (so an unwrapped sliver just past 180° still renders
// in view, in its correct real-world position east of the date line).
function unwrapRing(ring) {
  let offset = 0;
  let prevLng = ring[0][0];
  return ring.map(([lng, lat]) => {
    const delta = lng - prevLng;
    if (delta > 180) offset -= 360;
    else if (delta < -180) offset += 360;
    prevLng = lng;
    return [lng + offset, lat];
  });
}

function unwrapGeometry(geometry) {
  if (geometry.type === "Polygon") {
    return { ...geometry, coordinates: geometry.coordinates.map(unwrapRing) };
  }
  if (geometry.type === "MultiPolygon") {
    return { ...geometry, coordinates: geometry.coordinates.map((poly) => poly.map(unwrapRing)) };
  }
  return geometry;
}

let mapped = 0;
let skipped = [];
const features = geo.features
  .map((f) => {
    const alpha3 = countries.numericToAlpha3(String(f.id));
    if (!alpha3) {
      skipped.push(f.properties?.name ?? f.id);
      return null;
    }
    mapped++;
    return { ...f, id: alpha3, geometry: unwrapGeometry(f.geometry) };
  })
  .filter(Boolean);

const out = { type: "FeatureCollection", features };
// Lives in public/, not src/assets/, and is fetched at runtime rather than
// statically imported — a static import would inline all ~4MB into the main
// JS bundle (parsed-JSON-as-JS is heavier than raw JSON and can't be
// cached/loaded separately from app code).
const outPath = path.join(__dirname, "..", "public", "world-countries.geo.json");
fs.writeFileSync(outPath, JSON.stringify(out));

console.log(`Mapped ${mapped} features, skipped ${skipped.length}:`, skipped);
console.log(`Wrote ${outPath} (${(fs.statSync(outPath).size / 1024).toFixed(0)} KB)`);
