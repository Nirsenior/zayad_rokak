import { useAppSession } from '../context/AppSessionContext';

const BTN = 'var(--ds-org-option-btn)';

/** אופציות 1/2 — שני כפתורים קטנים, משמאל לסדרן (לא סיידבר) */
export function OptionSelector() {
  const { session, setStudyOption } = useAppSession();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        flexShrink: 0,
        paddingTop: 0,
        fontFamily: 'var(--ds-font)',
      }}
    >
      {([1, 2] as const).map(opt => {
        const active = session.studyOption === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => setStudyOption(opt)}
            title={`אופציה ${opt}`}
            style={{
              width: BTN,
              height: BTN,
              borderRadius: 'var(--ds-radius-md)',
              border: active ? '1px solid #5a8ab0' : '1px solid var(--ds-border-muted)',
              background: active ? 'rgba(29, 29, 30, 0.85)' : 'rgba(20, 21, 26, 0.75)',
              backdropFilter: 'var(--ds-blur-glass)',
              boxShadow: active ? 'var(--ds-shadow-glass)' : 'var(--ds-shadow-panel)',
              cursor: active ? 'default' : 'pointer',
              fontSize: 'var(--ds-org-text-lg)',
              fontWeight: 700,
              color: active ? 'var(--ds-text-primary)' : 'var(--ds-text-muted)',
              fontFamily: 'inherit',
              lineHeight: 1,
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
