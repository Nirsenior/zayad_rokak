import { createPortal } from 'react-dom';
import { getTopicById } from '../../tutorial/content';
import { useTutorial } from '../../context/TutorialContext';
import { TutorialInteractionGuard } from './TutorialInteractionGuard';
import { TutorialModal } from './TutorialModal';
import { TutorialSpotlight } from './TutorialSpotlight';

export function TutorialHost() {
  const { isOpen, view, spotlightPaused, activeTopicId, stepIndex } = useTutorial();

  if (!isOpen) return null;

  const inLesson = view === 'lesson';
  const topic = getTopicById(activeTopicId);
  const step = topic?.steps[stepIndex];

  return createPortal(
    <>
      {inLesson && (
        <>
          <TutorialSpotlight
            targetId={step?.targetId}
            targetIds={step?.targetIds}
            visible
            paused={spotlightPaused}
          />
          <TutorialInteractionGuard />
        </>
      )}
      <TutorialModal />
    </>,
    document.body,
  );
}
