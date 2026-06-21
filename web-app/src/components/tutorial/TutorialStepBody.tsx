import type { TutorialBodyPart } from '../../tutorial/types';

type Props = {
  parts: TutorialBodyPart[];
};

/** טקסט שלב — כפתורי AI בסגנון הכפתור האמיתי, שמות מרשם מודגשים */
export function TutorialStepBody({ parts }: Props) {
  return (
    <p
      style={{
        margin: 0,
        fontSize: 15,
        lineHeight: 1.65,
        color: '#c5c6ca',
      }}
    >
      {parts.map((part, i) => {
        if (typeof part === 'string') {
          return (
            <span key={i}>
              {i > 0 && typeof parts[i - 1] === 'string' && <br />}
              {part}
            </span>
          );
        }
        if (part.kind === 'layer') {
          return (
            <strong
              key={i}
              style={{ color: '#f0f4f8', fontWeight: 700 }}
            >
              {part.label}
            </strong>
          );
        }
        return (
          <span
            key={i}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              verticalAlign: 'middle',
              margin: '0 4px',
              padding: '2px 8px',
              borderRadius: 4,
              border: '1px solid #5b4fc7',
              background: 'linear-gradient(135deg, #4338ca 0%, #6d28d9 50%, #7c3aed 100%)',
              color: '#f5f3ff',
              fontSize: 12,
              fontWeight: 700,
              lineHeight: 1.35,
              boxShadow: '0 0 8px rgba(124, 58, 237, 0.35)',
              whiteSpace: 'nowrap',
            }}
          >
            {part.label}
          </span>
        );
      })}
    </p>
  );
}
