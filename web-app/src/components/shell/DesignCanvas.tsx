import type { ReactNode } from 'react';
import { useDesignScale, DESIGN_WIDTH, DESIGN_HEIGHT } from '../../hooks/useDesignScale';
import { DesignScaleProvider } from '../../context/DesignScaleContext';

type Props = {
  children: ReactNode;
};

/** מעטפת 1920×1080 מ-Figma — scale אחיד לפי גודל החלון */
export function DesignCanvas({ children }: Props) {
  const { containerRef, scale } = useDesignScale();

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--ds-bg-app)',
      }}
    >
      <div
        style={{
          width: DESIGN_WIDTH,
          height: DESIGN_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          position: 'relative',
          flexShrink: 0,
          fontSize: 16,
        }}
      >
        <DesignScaleProvider scale={scale}>{children}</DesignScaleProvider>
      </div>
    </div>
  );
}
