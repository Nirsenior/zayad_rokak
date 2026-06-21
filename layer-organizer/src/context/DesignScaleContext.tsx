import { createContext, useContext, type ReactNode } from 'react';

const DesignScaleContext = createContext(1);

export function DesignScaleProvider({ scale, children }: { scale: number; children: ReactNode }) {
  return <DesignScaleContext.Provider value={scale}>{children}</DesignScaleContext.Provider>;
}

/** מקדם scale של קנבס 1920×1080 — לפורטלים (דרופדאון וכו') */
export function useDesignScaleValue(): number {
  return useContext(DesignScaleContext);
}
