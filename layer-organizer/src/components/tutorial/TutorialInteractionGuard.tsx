import { useEffect } from 'react';
import { useTutorial } from '../../context/TutorialContext';

/** השהיית סימוני מסך בנגיעה מחוץ לחלונית — החלונית נשארת פתוחה */
export function TutorialInteractionGuard() {
  const { isOpen, spotlightPaused, pauseSpotlight } = useTutorial();

  useEffect(() => {
    if (!isOpen || spotlightPaused) return;

    const onPointerDown = (e: PointerEvent) => {
      const panel = document.getElementById('tutorial-modal-panel');
      if (panel?.contains(e.target as Node)) return;
      pauseSpotlight();
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [isOpen, spotlightPaused, pauseSpotlight]);

  return null;
}
