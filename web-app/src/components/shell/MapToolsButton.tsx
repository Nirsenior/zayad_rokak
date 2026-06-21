import { figmaAssets } from '../../assets/figmaAssets';

/** Tools — Figma node 451:101510 */
export function MapToolsButton() {
  return (
    <button
      type="button"
      title="כלים"
      aria-label="כלי מפה"
      style={{
        width: 'var(--ds-tool-btn-size)',
        height: 'var(--ds-tool-btn-size)',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--ds-bg-default)',
        border: '1px solid var(--ds-border-subtle)',
        borderRadius: 'var(--ds-radius-md)',
        boxShadow: 'var(--ds-shadow-panel)',
        cursor: 'default',
        padding: 0,
      }}
    >
      <img src={figmaAssets.toolsIcon} alt="" width={28} height={28} />
    </button>
  );
}
