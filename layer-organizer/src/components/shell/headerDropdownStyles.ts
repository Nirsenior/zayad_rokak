import type { CSSProperties } from 'react';

export const HEADER_FONT = 'Assistant, var(--ds-font)';

export const headerDropdownPanel: CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 4px)',
  minWidth: 200,
  backdropFilter: 'blur(3.5px)',
  background: 'rgba(20, 21, 26, 0.9)',
  borderRadius: 10,
  boxShadow: '0 2px 20px 2px rgba(0, 0, 0, 0.4)',
  zIndex: 2100,
  overflow: 'hidden',
  direction: 'rtl',
  fontFamily: HEADER_FONT,
  boxSizing: 'border-box',
};

export const headerDropdownTitle: CSSProperties = {
  margin: 0,
  padding: '8px 12px 6px',
  fontSize: 12,
  fontWeight: 400,
  lineHeight: 'normal',
  color: '#c5c6ca',
  textAlign: 'right',
  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
};

export function headerDropdownRow(active: boolean): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '8px 12px',
    background: active ? '#32363f' : 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontFamily: HEADER_FONT,
    textAlign: 'right',
  };
}
