import { useTutorialTargetRect } from '../../hooks/useTutorialTargetRect';
import type { TutorialTargetId } from '../../tutorial/types';

type Props = {
  targetId?: TutorialTargetId;
  targetIds?: TutorialTargetId[];
  visible: boolean;
  paused?: boolean;
};

/** מסגרת הדגשה בלבד — בלי כהיית מסך, כדי לאפשר אינטראקציה */
export function TutorialSpotlight({ targetId, targetIds, visible, paused = false }: Props) {
  const ids = targetIds ?? (targetId ? [targetId] : undefined);
  const show = visible && !paused && !!ids?.length;
  const rect = useTutorialTargetRect(ids, show);

  if (!show || !rect) return null;

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        zIndex: 2901,
        borderRadius: 8,
        border: '2px solid #a78bfa',
        boxShadow: '0 0 0 2px rgba(167, 139, 250, 0.45), 0 0 28px rgba(124, 58, 237, 0.65)',
        pointerEvents: 'none',
        transition: 'top 0.15s, left 0.15s, width 0.15s, height 0.15s',
      }}
    />
  );
}
