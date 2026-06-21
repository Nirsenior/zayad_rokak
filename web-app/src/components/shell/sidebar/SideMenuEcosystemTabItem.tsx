import type { SidebarNavItemResolved } from '../../../types/sidebarUi';
import { sidebarHoverTitle } from '../../../utils/sidebarHoverTitle';

const BTN = 40;

function TabIcon({ src }: { src: string }) {
  return (
    <div
      style={{
        width: 20,
        height: 20,
        overflow: 'hidden',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <img
        src={src}
        alt=""
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          maxWidth: 'none',
          objectFit: 'contain',
        }}
      />
    </div>
  );
}

type Props = {
  item: SidebarNavItemResolved;
  onClick?: () => void;
  tutorialId?: string;
};

/** Figma 392:30648 — כפתור טאב אקוסיסטם (תחקיר) */
export function SideMenuEcosystemTabItem({ item, onClick, tutorialId }: Props) {
  const active = item.active;
  const locked = item.locked;

  function buildTitle() {
    if (locked && item.requiredRoleLabel) {
      return `נדרשת הרשאת תפקיד ${item.requiredRoleLabel} לצורך פתיחה`;
    }
    return sidebarHoverTitle(item.label, item.devResponsibility);
  }

  return (
    <div
      data-tutorial-id={tutorialId}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        flexShrink: 0,
        opacity: locked ? 0.45 : 1,
      }}
    >
      <button
        type="button"
        title={buildTitle()}
        onClick={locked ? undefined : onClick}
        disabled={locked}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: BTN,
          height: BTN,
          padding: 0,
          border: locked ? '1px dashed rgba(255,255,255,0.2)' : 'none',
          borderRadius: 6,
          background: active ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
          cursor: locked ? 'not-allowed' : onClick ? 'pointer' : 'default',
          boxSizing: 'border-box',
        }}
      >
        <TabIcon src={item.icon} />
      </button>
      {item.labelLines ? (
        <div
          style={{
            margin: '2px 0 0',
            width: '100%',
            fontFamily: 'Assistant, var(--ds-font)',
            fontWeight: 700,
            fontSize: 12,
            lineHeight: '16px',
            letterSpacing: '0.04px',
            color: active ? '#ffffff' : 'rgba(241, 247, 254, 0.71)',
            textAlign: 'center',
          }}
        >
          {item.labelLines.map((line, i) => (
            <p key={i} style={{ margin: 0, whiteSpace: 'normal', wordBreak: 'keep-all' }}>
              {line}
            </p>
          ))}
        </div>
      ) : (
        <p
          style={{
            margin: '2px 0 0',
            fontFamily: 'Assistant, var(--ds-font)',
            fontWeight: 700,
            fontSize: 12,
            lineHeight: '16px',
            letterSpacing: '0.04px',
            color: active ? '#ffffff' : 'rgba(241, 247, 254, 0.71)',
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          {item.label}
        </p>
      )}
    </div>
  );
}
