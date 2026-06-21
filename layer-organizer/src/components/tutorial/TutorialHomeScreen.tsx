import type { CSSProperties } from 'react';
import { TUTORIAL_TOPICS } from '../../tutorial/content';
import { useTutorial } from '../../context/TutorialContext';
import { useDraggablePanel } from './useDraggablePanel';

const panelShell: CSSProperties = {
  position: 'fixed',
  left: '50%',
  top: '50%',
  pointerEvents: 'auto',
  background: 'linear-gradient(180deg, #1e2430 0%, #161a22 100%)',
  border: '1px solid #3d4556',
  borderRadius: 10,
  boxShadow: '0 16px 48px rgba(0,0,0,0.65)',
  direction: 'rtl',
  fontFamily: 'var(--ds-font)',
  overflow: 'hidden',
};

type Props = {
  panelId: string;
};

/** מסך פתיחה — בחירת נושא הדרכה */
export function TutorialHomeScreen({ panelId }: Props) {
  const { close, startTopic } = useTutorial();
  const { offset, onDragPointerDown, onDragPointerMove, onDragPointerUp } =
    useDraggablePanel(true);

  return (
    <div
      id={panelId}
      style={{
        ...panelShell,
        transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
        width: 400,
        maxWidth: 'calc(100vw - 48px)',
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
          padding: '14px 16px 12px',
          borderBottom: '1px solid #333842',
          cursor: 'grab',
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        <h2
          id="tutorial-home-title"
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 700,
            color: '#f0f4f8',
          }}
        >
          הדרכה
        </h2>
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
          }}
        >
          ×
        </button>
      </div>

      <p
        style={{
          margin: 0,
          padding: '16px 16px 8px',
          fontSize: 14,
          color: '#9ca3af',
        }}
      >
        בחרו נושא להדרכה:
      </p>

      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: '0 12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {TUTORIAL_TOPICS.map(topic => (
          <li key={topic.id}>
            <button
              type="button"
              onClick={() => startTopic(topic.id)}
              style={{
                width: '100%',
                textAlign: 'right',
                padding: '12px 14px',
                borderRadius: 8,
                border: '1px solid #3d4556',
                background: '#22262e',
                color: '#f0f4f8',
                fontSize: 15,
                fontWeight: 600,
                fontFamily: 'inherit',
                cursor: 'pointer',
                transition: 'background 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget;
                el.style.background = 'rgba(167, 139, 250, 0.12)';
                el.style.borderColor = '#6d28d9';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget;
                el.style.background = '#22262e';
                el.style.borderColor = '#3d4556';
              }}
            >
              {topic.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
