import { useEffect, useState, useRef } from 'react';

export const DESIGN_WIDTH = 1920;
export const DESIGN_HEIGHT = 1080;

/** Scale 1920×1080 design to fit container without distortion */
export function useDesignScale() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const sw = el.clientWidth / DESIGN_WIDTH;
      const sh = el.clientHeight / DESIGN_HEIGHT;
      setScale(Math.min(sw, sh));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { containerRef, scale };
}
