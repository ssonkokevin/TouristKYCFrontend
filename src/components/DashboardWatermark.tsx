import { useMemo, useState } from "react";
import valleyScene from "@/assets/watermark/valley-scene.png";
import passportVerified from "@/assets/watermark/passport-verified.png";
import travelerOutdoors from "@/assets/watermark/traveler-outdoors.png";
import simActivated from "@/assets/watermark/sim-activated.png";

const WATERMARK_IMAGES = [valleyScene, passportVerified, travelerOutdoors, simActivated];

function shuffled<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Faint fixed 2x2 collage sitting behind the sidebar/topbar/content on every
// authenticated page. Quadrant order is reshuffled once per mount (i.e. once
// per login/full page load), so it varies across sessions.
export function DashboardWatermark() {
  const images = useMemo(() => shuffled(WATERMARK_IMAGES), []);
  const [failed, setFailed] = useState<Record<number, boolean>>({});

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 grid grid-cols-2 grid-rows-2 overflow-hidden"
    >
      {images.map((src, i) => (
        <div key={i} className="relative overflow-hidden bg-kyc-brand-tint">
          {!failed[i] && (
            <>
              <img
                src={src}
                alt=""
                className="h-full w-full object-cover"
                style={{ opacity: 0.045, filter: "grayscale(0.6) blur(1.5px) saturate(0.7)" }}
                draggable={false}
                onError={() => setFailed((f) => ({ ...f, [i]: true }))}
              />
              {/* Heavy white wash so the photo reads only as faint branded
                  paper texture and never competes with charts/map/text. */}
              <div className="absolute inset-0" style={{ backgroundColor: "rgba(255,255,255,0.6)" }} />
            </>
          )}
        </div>
      ))}
    </div>
  );
}
