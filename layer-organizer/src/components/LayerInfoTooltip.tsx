import { useState, useRef, useCallback, useLayoutEffect, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { Layer, VisibilityLevel, SharingMode } from '../types';
import {
  SHARING_MODE_COLORS,
  SHARING_MODE_LABELS,
} from '../constants/sharingMode';
import {
  TankIcon,
  FlagIcon,
  BuildingIcon,
  ShareUnitIcon,
  ShareBrigadeIcon,
  SharePoolIcon,
} from './Icons';

const TOOLTIP_W = 128;
const GAP = 5;
const ICON_SLOT = 14;

const LENGTH_CONFIG: Record<VisibilityLevel, {
  Icon: typeof TankIcon;
  color: string;
  value: string;
}> = {
  'techno-tactical': { Icon: TankIcon, color: '#22c55e', value: 'עד טכנו טקטי' },
  'tactical-hq': { Icon: FlagIcon, color: '#eab308', value: 'עד מפקדה טקטית' },
  'hq-only': { Icon: BuildingIcon, color: '#ef4444', value: 'רק במפקדה' },
};

const WIDTH_ICONS: Record<SharingMode, typeof ShareUnitIcon> = {
  unit: ShareUnitIcon,
  brigade: ShareBrigadeIcon,
  pool: SharePoolIcon,
};

function placeBesideButton(anchor: DOMRect, tooltipHeight: number) {
  const left = anchor.left - TOOLTIP_W - GAP;
  let top = anchor.top + anchor.height / 2 - tooltipHeight / 2;
  top = Math.max(8, Math.min(top, window.innerHeight - tooltipHeight - 8));
  return { top, left };
}

const labelStyle: CSSProperties = {
  fontSize: 9,
  fontWeight: 600,
  color: 'var(--ds-text-muted)',
  lineHeight: 1.15,
};

const valueStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 500,
  color: 'var(--ds-text-primary)',
  lineHeight: 1.2,
  whiteSpace: 'nowrap',
};

function TooltipRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        direction: 'rtl',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={labelStyle}>{label}</div>
        <div style={valueStyle}>{value}</div>
      </div>
      <div
        style={{
          flexShrink: 0,
          width: ICON_SLOT,
          height: ICON_SLOT,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </div>
    </div>
  );
}

export function LayerInfoTooltip({ layer }: { layer: Layer }) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);

  const length = LENGTH_CONFIG[layer.visibility];
  const widthMode = layer.sharing;
  const WidthIcon = widthMode ? WIDTH_ICONS[widthMode] : null;
  const widthColor = widthMode ? SHARING_MODE_COLORS[widthMode] : undefined;

  const updatePosition = useCallback(() => {
    const btn = btnRef.current;
    const tip = tipRef.current;
    if (!btn || !tip) return;
    setPos(placeBesideButton(btn.getBoundingClientRect(), tip.offsetHeight));
  }, []);

  const open = useCallback(() => setVisible(true), []);
  const close = useCallback(() => {
    setVisible(false);
    setPos(null);
  }, []);

  useLayoutEffect(() => {
    if (!visible) return;
    updatePosition();
    const onScroll = () => updatePosition();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [visible, updatePosition, widthMode]);

  const tooltipPanel = visible && (
    <div
      ref={tipRef}
      role="tooltip"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={close}
      style={{
        position: 'fixed',
        top: pos?.top ?? -9999,
        left: pos?.left ?? -9999,
        width: TOOLTIP_W,
        visibility: pos ? 'visible' : 'hidden',
        background: 'var(--ds-organizer-header)',
        border: '1px solid var(--ds-organizer-border)',
        borderRadius: 4,
        boxShadow: '0 2px 8px rgba(0,0,0,0.45)',
        zIndex: 10000,
        padding: '5px 7px',
        direction: 'rtl',
        fontFamily: 'var(--ds-font)',
        pointerEvents: 'auto',
        boxSizing: 'border-box',
      }}
    >
      <TooltipRow
        label="אורך"
        value={length.value}
        icon={<length.Icon size={11} color={length.color} />}
      />

      {widthMode && WidthIcon && widthColor && (
        <>
          <div
            style={{
              borderTop: '1px solid var(--ds-organizer-border)',
              margin: '5px 0',
              opacity: 0.7,
            }}
          />
          <TooltipRow
            label="רוחב"
            value={SHARING_MODE_LABELS[widthMode]}
            icon={<WidthIcon size={11} color={widthColor} />}
          />
        </>
      )}
    </div>
  );

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onMouseEnter={open}
        onMouseLeave={close}
        onFocus={open}
        onBlur={close}
        title="מידע על שכבה"
        style={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          border: '1px solid var(--ds-organizer-border)',
          background: visible ? 'var(--ds-organizer-hover)' : 'transparent',
          cursor: 'pointer',
          fontSize: 9,
          fontWeight: 700,
          color: 'var(--ds-text-secondary)',
          fontFamily: 'var(--ds-font)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1,
          flexShrink: 0,
          transition: 'background 0.15s',
        }}
      >
        i
      </button>

      {tooltipPanel && createPortal(tooltipPanel, document.body)}
    </>
  );
}
