import { useState, useCallback, useRef, useEffect } from 'react';

export function useDraggablePanel(enabled: boolean) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    if (enabled) setOffset({ x: 0, y: 0 });
  }, [enabled]);

  const onDragPointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      ox: offset.x,
      oy: offset.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [offset.x, offset.y]);

  const onDragPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    setOffset({
      x: dragRef.current.ox + (e.clientX - dragRef.current.startX),
      y: dragRef.current.oy + (e.clientY - dragRef.current.startY),
    });
  }, []);

  const onDragPointerUp = useCallback((e: React.PointerEvent) => {
    dragRef.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  }, []);

  return { offset, onDragPointerDown, onDragPointerMove, onDragPointerUp };
}
