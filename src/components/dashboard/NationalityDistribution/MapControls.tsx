import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useMap } from "react-leaflet";
import { ZoomIn, ZoomOut, LocateFixed } from "lucide-react";

const btnClass =
  "flex h-7 w-7 items-center justify-center rounded-md bg-white text-slate-600 shadow-sm border border-kyc-border hover:bg-kyc-brand-tint hover:text-kyc-brand transition-colors";

export function MapControls({ onReset }: { onReset: () => void }) {
  const map = useMap();
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setContainer(map.getContainer());
  }, [map]);

  if (!container) return null;

  return createPortal(
    <div className="absolute left-2 top-2 z-[800] flex flex-col gap-1.5">
      <button type="button" className={btnClass} title="Zoom in" onClick={() => map.zoomIn()}>
        <ZoomIn className="h-3.5 w-3.5" />
      </button>
      <button type="button" className={btnClass} title="Zoom out" onClick={() => map.zoomOut()}>
        <ZoomOut className="h-3.5 w-3.5" />
      </button>
      <button type="button" className={btnClass} title="Reset view" onClick={onReset}>
        <LocateFixed className="h-3.5 w-3.5" />
      </button>
    </div>,
    container
  );
}
