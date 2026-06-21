import { figmaAssets } from '../../assets/figmaAssets';

/** Rectangle 1562 — Figma 451:107977 */
export function HeaderSearchButton() {
  return (
    <button
      type="button"
      title="חיפוש"
      style={{
        position: 'absolute',
        left: 106,
        top: 3,
        width: 101,
        height: 32,
        margin: 0,
        padding: '0 12px 0 10px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 8,
        direction: 'rtl',
        background: '#3a3a3a',
        border: '1.167px solid #7b7b7b',
        borderRadius: 23,
        boxShadow: '0 0 2.333px rgba(0, 0, 0, 0.4)',
        cursor: 'pointer',
        fontFamily: 'var(--ds-font)',
      }}
    >
      <span
        style={{
          fontSize: 16,
          fontWeight: 400,
          lineHeight: '24px',
          color: '#ffffff',
          whiteSpace: 'nowrap',
        }}
      >
        חיפוש
      </span>
      <img
        src={figmaAssets.searchIcon}
        alt=""
        width={16}
        height={16}
        style={{ flexShrink: 0, objectFit: 'contain' }}
      />
    </button>
  );
}
