import { useTutorial } from '../../context/TutorialContext';
import { TutorialHomeScreen } from './TutorialHomeScreen';
import { TutorialLessonPanel } from './TutorialLessonPanel';

const PANEL_ID = 'tutorial-modal-panel';

/** מעטפת הדרכה — מסך בית או שיעור */
export function TutorialModal() {
  const { isOpen, view } = useTutorial();

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={view === 'home' ? 'tutorial-home-title' : 'tutorial-step-title'}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 3000,
        pointerEvents: 'none',
      }}
    >
      {view === 'home' ? (
        <TutorialHomeScreen panelId={PANEL_ID} />
      ) : (
        <TutorialLessonPanel panelId={PANEL_ID} />
      )}
    </div>
  );
}
