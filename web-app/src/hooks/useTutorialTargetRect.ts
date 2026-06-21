import { useEffect, useState } from 'react';

export interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 10;

function measureTargets(targetIds: string[]): TargetRect | null {
  const rects: DOMRect[] = [];
  for (const id of targetIds) {
    const el = document.querySelector(`[data-tutorial-id="${id}"]`);
    if (el) rects.push(el.getBoundingClientRect());
  }
  if (rects.length === 0) return null;

  const top = Math.min(...rects.map(r => r.top)) - PADDING;
  const left = Math.min(...rects.map(r => r.left)) - PADDING;
  const right = Math.max(...rects.map(r => r.right)) + PADDING;
  const bottom = Math.max(...rects.map(r => r.bottom)) + PADDING;

  return {
    top,
    left,
    width: right - left,
    height: bottom - top,
  };
}

export function useTutorialTargetRect(targetIds: string[] | undefined, enabled: boolean) {
  const [rect, setRect] = useState<TargetRect | null>(null);
  const key = targetIds?.join(',') ?? '';

  useEffect(() => {
    if (!enabled || !targetIds?.length) {
      setRect(null);
      return;
    }

    const measure = () => setRect(measureTargets(targetIds));

    measure();
    const interval = window.setInterval(measure, 200);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [key, enabled, targetIds]);

  return rect;
}
