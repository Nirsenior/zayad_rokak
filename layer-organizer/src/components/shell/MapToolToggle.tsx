type Props = {
  active: boolean;
  disabled?: boolean;
  icon: string;
  iconWidth?: number;
  iconHeight?: number;
  ariaLabel: string;
  title: string;
  onClick: () => void;
  tutorialId?: string;
};

/** כפתור כלי מרחף על המפה — בסגנון סדרן המרשמים */
export function MapToolToggle({
  active,
  disabled = false,
  icon,
  iconWidth = 24,
  iconHeight = 24,
  ariaLabel,
  title,
  onClick,
  tutorialId,
}: Props) {
  return (
    <button
      type="button"
      data-tutorial-id={tutorialId}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={active}
      aria-expanded={active}
      aria-disabled={disabled}
      aria-label={ariaLabel}
      style={{
        width: 'var(--ds-tool-btn-size)',
        height: 'var(--ds-tool-btn-size)',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: active ? 'var(--ds-side-menu-active-bg)' : 'var(--ds-bg-default)',
        border: `1px solid ${active ? 'var(--ds-border-muted)' : 'var(--ds-border-subtle)'}`,
        borderRadius: 'var(--ds-radius-md)',
        boxShadow: 'var(--ds-shadow-panel)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        padding: 0,
        transition: 'background 0.15s, border-color 0.15s, opacity 0.15s',
      }}
    >
      <img
        src={icon}
        alt=""
        width={iconWidth}
        height={iconHeight}
        style={{ display: 'block', marginTop: 2 }}
      />
    </button>
  );
}
