import type { CSSProperties } from 'react';
import { TUTORIAL_TOPICS, getTopicById } from '../../tutorial/content';
import { useTutorial } from '../../context/TutorialContext';
import { TutorialStepBody } from './TutorialStepBody';
import { useDraggablePanel } from './useDraggablePanel';

type Props = {
  panelId: string;
};

const panelShell: CSSProperties = {
  position: 'fixed',
  left: '50%',
  top: '50%',
  pointerEvents: 'auto',
  width: 640,
  maxWidth: 'calc(100vw - 48px)',
  maxHeight: 'calc(100vh - 48px)',
  background: 'linear-gradient(180deg, #1e2430 0%, #161a22 100%)',
  border: '1px solid #3d4556',
  borderRadius: 10,
  boxShadow: '0 16px 48px rgba(0,0,0,0.65)',
  display: 'flex',
  flexDirection: 'row',
  direction: 'ltr',
  overflow: 'hidden',
  fontFamily: 'var(--ds-font)',
};

/** מסך הדרכה פעילה — נושאים בצד + שלבים */
export function TutorialLessonPanel({ panelId }: Props) {
  const {
    activeTopicId,
    stepIndex,
    spotlightPaused,
    close,
    finishLesson,
    openHome,
    selectTopic,
    nextStep,
    prevStep,
  } = useTutorial();

  const { offset, onDragPointerDown, onDragPointerMove, onDragPointerUp } =
    useDraggablePanel(true);

  const topic = getTopicById(activeTopicId) ?? TUTORIAL_TOPICS[0];
  const step = topic.steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex >= topic.steps.length - 1;

  return (
    <div
      id={panelId}
      style={{
        ...panelShell,
        transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
      }}
    >
      <aside
        style={{
          width: 168,
          flexShrink: 0,
          borderRight: '1px solid #333842',
          background: '#141820',
          padding: '12px 0',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            padding: '0 14px 10px',
            fontSize: 11,
            fontWeight: 700,
            color: '#9ca3af',
            letterSpacing: 0.4,
            textTransform: 'uppercase',
          }}
        >
          נושאים
        </div>
        {TUTORIAL_TOPICS.map(t => {
          const active = t.id === activeTopicId;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => selectTopic(t.id)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'right',
                direction: 'rtl',
                padding: '10px 14px',
                border: 'none',
                borderRight: active ? '3px solid #a78bfa' : '3px solid transparent',
                background: active ? 'rgba(167, 139, 250, 0.12)' : 'transparent',
                color: active ? '#f5f3ff' : '#c5c6ca',
                fontSize: 14,
                fontWeight: active ? 700 : 500,
                fontFamily: 'inherit',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {t.label}
            </button>
          );
        })}
      </aside>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          direction: 'rtl',
        }}
      >
        <div
          onPointerDown={onDragPointerDown}
          onPointerMove={onDragPointerMove}
          onPointerUp={onDragPointerUp}
          onPointerCancel={onDragPointerUp}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            padding: '14px 16px 10px',
            borderBottom: '1px solid #333842',
            cursor: 'grab',
            touchAction: 'none',
            userSelect: 'none',
          }}
        >
          <button
            type="button"
            onClick={openHome}
            title="חזרה לנושאים"
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid #4a5060',
              background: 'transparent',
              color: '#c5c6ca',
              fontSize: 12,
              fontFamily: 'inherit',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            ← נושאים
          </button>
          <span style={{ flex: 1, fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
            {topic.label} · {stepIndex + 1}/{topic.steps.length}
          </span>
          <button
            type="button"
            onClick={close}
            aria-label="סגור הדרכה"
            title="סגור"
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              border: '1px solid #4a5060',
              background: 'transparent',
              color: '#e8e8ec',
              fontSize: 18,
              lineHeight: 1,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ flex: 1, padding: '20px 20px 12px', overflowY: 'auto' }}>
          <h2
            id="tutorial-step-title"
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 700,
              color: '#f0f4f8',
              lineHeight: 1.35,
              marginBottom: step.bodyParts?.length ? 12 : 0,
            }}
          >
            {step.title}
          </h2>
          {step.bodyParts && step.bodyParts.length > 0 && (
            <TutorialStepBody parts={step.bodyParts} />
          )}
          {spotlightPaused && (
            <p
              style={{
                margin: '14px 0 0',
                fontSize: 13,
                lineHeight: 1.45,
                color: '#9ca3af',
                fontStyle: 'italic',
              }}
            >
              נגעתם במסך — הסימון הושהה. לחצו הבא או הקודם כדי להמשיך את ההדרכה.
            </p>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: '12px 16px 16px',
            borderTop: '1px solid #333842',
          }}
        >
          <button
            type="button"
            onClick={prevStep}
            disabled={isFirst}
            aria-label="שלב קודם"
            style={navBtnStyle(isFirst)}
          >
            <span aria-hidden>→</span>
            <span>הקודם</span>
          </button>
          <button
            type="button"
            onClick={isLast ? finishLesson : nextStep}
            aria-label={isLast ? 'סיום' : 'שלב הבא'}
            style={{
              ...navBtnStyle(false),
              background: 'linear-gradient(135deg, #4338ca, #7c3aed)',
              borderColor: '#6d28d9',
              color: '#fff',
              fontWeight: 700,
            }}
          >
            <span>{isLast ? 'סיום' : 'הבא'}</span>
            {!isLast && <span aria-hidden>←</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

function navBtnStyle(disabled: boolean): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 16px',
    borderRadius: 6,
    border: '1px solid #4a5060',
    background: '#22262e',
    color: disabled ? '#6b7280' : '#e8e8ec',
    fontSize: 14,
    fontFamily: 'inherit',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.55 : 1,
  };
}
