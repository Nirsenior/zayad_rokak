import { useState, useEffect, useCallback, useRef } from 'react';
import type React from 'react';
import { useLayerOrganizer } from '../context/LayerOrganizerContext';
import {
  getAdvancedPlanningCopy,
  getPlanningEditEntities,
  type PlanningEditEntity,
  type PlanningEditSuffix,
} from '../data/rules/planningEditEntities';
import {
  PLANNING_EDIT_PANEL_WIDTH,
  PLANNING_EDIT_TOP,
  planningEditDefaultRight,
} from './shell/organizerLayout';

const CYAN = '#2dd4bf';
const ORANGE = '#f59e0b';

const ADVANCED_PLANNING_SUFFIXES: PlanningEditSuffix[] = ['shtakh', 'oyev', 'mivtzaim'];

type Props = {
  organizerAnchorRight: number;
};

function EntityIcon({ icon }: { icon: PlanningEditEntity['icon'] }) {
  const common: React.SVGProps<SVGSVGElement> = {
    width: 44,
    height: 44,
    viewBox: '0 0 44 44',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
  };

  switch (icon) {
    case 'pentagon':
    case 'enemy-staging':
    case 'area-control':
    case 'destruction':
      return (
        <svg {...common}>
          <polygon
            points="22,6 38,16 34,36 10,36 6,16"
            stroke={CYAN}
            strokeWidth="1.8"
            fill="none"
          />
          {['6,16', '22,6', '38,16', '34,36', '10,36'].map((p, i) => (
            <circle key={i} cx={p.split(',')[0]} cy={p.split(',')[1]} r="2.2" fill={CYAN} />
          ))}
        </svg>
      );
    case 'axis':
      return (
        <svg {...common}>
          <path d="M8 28 L18 18 L26 24 L36 12" stroke={ORANGE} strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    case 'objective':
      return (
        <svg {...common}>
          <circle cx="22" cy="22" r="10" stroke={CYAN} strokeWidth="1.8" />
          <circle cx="22" cy="22" r="3" fill={CYAN} />
        </svg>
      );
    case 'arrow':
      return (
        <svg {...common}>
          <path
            d="M10 30 L28 14 L28 22 L34 22 L22 36 L10 22 L16 22 L16 14 Z"
            stroke={CYAN}
            strokeWidth="1.6"
            fill="rgba(45,212,191,0.15)"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'phase-line':
      return (
        <svg {...common}>
          <line x1="8" y1="28" x2="36" y2="28" stroke={CYAN} strokeWidth="2" strokeDasharray="4 3" />
          <line x1="8" y1="18" x2="36" y2="18" stroke={CYAN} strokeWidth="1.2" opacity="0.5" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <rect x="12" y="12" width="20" height="20" stroke={CYAN} strokeWidth="1.8" rx="2" />
        </svg>
      );
  }
}

function usePanelDrag(enabled: boolean) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);

  const reset = useCallback(() => setOffset({ x: 0, y: 0 }), []);

  const onHeaderPointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      ox: offset.x,
      oy: offset.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [offset.x, offset.y]);

  const onHeaderPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    setOffset({
      x: dragRef.current.ox + (e.clientX - dragRef.current.startX),
      y: dragRef.current.oy + (e.clientY - dragRef.current.startY),
    });
  }, []);

  const onHeaderPointerUp = useCallback((e: React.PointerEvent) => {
    dragRef.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  }, []);

  useEffect(() => {
    if (!enabled) reset();
  }, [enabled, reset]);

  return { offset, reset, onHeaderPointerDown, onHeaderPointerMove, onHeaderPointerUp };
}

export function PlanningEditPanel({ organizerAnchorRight }: Props) {
  const { state, closePlanningEdit } = useLayerOrganizer();
  const target = state.planningEditTarget;
  const [sectionOpen, setSectionOpen] = useState(true);
  const { offset, reset, onHeaderPointerDown, onHeaderPointerMove, onHeaderPointerUp } =
    usePanelDrag(!!target);

  useEffect(() => {
    reset();
  }, [target?.layerId, reset]);

  if (!target) return null;

  const { sectionTitle, items } = getPlanningEditEntities(target.suffix);
  const headerLine = `${target.planName} — ${target.layerName}`;
  const showAdvancedPlanning = ADVANCED_PLANNING_SUFFIXES.includes(target.suffix);
  const advancedPlanning = showAdvancedPlanning
    ? getAdvancedPlanningCopy(target.suffix)
    : null;
  const defaultRight = planningEditDefaultRight(organizerAnchorRight);

  const handleAdvancedPlanning = () => {
    /* חיבור ל-AI — בהמשך */
  };

  return (
    <div
      role="dialog"
      aria-labelledby="planning-edit-title"
      style={{
        position: 'absolute',
        right: defaultRight,
        top: PLANNING_EDIT_TOP,
        width: PLANNING_EDIT_PANEL_WIDTH,
        maxHeight: 520,
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        background: '#1c1f26',
        border: '1px solid #3a3f4a',
        borderRadius: 6,
        boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        direction: 'rtl',
        fontFamily: 'var(--ds-font)',
        overflow: 'hidden',
        pointerEvents: 'auto',
      }}
    >
      <div
        onPointerDown={onHeaderPointerDown}
        onPointerMove={onHeaderPointerMove}
        onPointerUp={onHeaderPointerUp}
        onPointerCancel={onHeaderPointerUp}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '12px 14px',
          borderBottom: '1px solid #3a3f4a',
          background: 'linear-gradient(180deg, #2a2e38 0%, #22262e 100%)',
          flexShrink: 0,
          cursor: 'grab',
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            id="planning-edit-title"
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--ds-text-heading)',
              lineHeight: 1.35,
            }}
          >
            {headerLine}
          </div>
        </div>
        <button
          type="button"
          onClick={closePlanningEdit}
          title="סגור"
          style={{
            flexShrink: 0,
            background: 'none',
            border: '1px solid #4a5060',
            borderRadius: 4,
            color: 'var(--ds-text-secondary)',
            cursor: 'pointer',
            width: 28,
            height: 28,
            fontSize: 16,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <button
          type="button"
          onClick={() => setSectionOpen(o => !o)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            padding: '10px 14px',
            border: 'none',
            borderBottom: '1px solid #333842',
            background: 'repeating-linear-gradient(135deg, #353941 0, #353941 2px, #2e323a 2px, #2e323a 4px)',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: '#f0f4f8' }}>
            {sectionTitle}
          </span>
          <span
            style={{
              color: '#9ca3af',
              fontSize: 10,
              transform: sectionOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
              transition: 'transform 0.15s',
            }}
          >
            ▼
          </span>
        </button>

        {sectionOpen && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '14px 8px',
              padding: '16px 12px 8px',
            }}
          >
            {items.map(entity => (
              <button
                key={entity.id}
                type="button"
                title={entity.label}
                onClick={() => {}}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  fontFamily: 'inherit',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
              >
                <EntityIcon icon={entity.icon} />
                <span
                  style={{
                    fontSize: 11,
                    color: '#e8eaed',
                    textAlign: 'center',
                    lineHeight: 1.25,
                    maxWidth: 72,
                  }}
                >
                  {entity.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {advancedPlanning && (
        <div
          style={{
            flexShrink: 0,
            padding: '10px 12px 12px',
            borderTop: '1px solid #3a3f4a',
            background: '#181b21',
          }}
        >
          <button
            type="button"
            data-tutorial-id={
              target.suffix === 'shtakh'
                ? 'advanced-planning-shtakh'
                : target.suffix === 'oyev'
                  ? 'advanced-planning-oyev'
                  : 'advanced-planning-mivtzaim'
            }
            onClick={handleAdvancedPlanning}
            title={advancedPlanning.tooltip}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 6,
              border: '1px solid #5b4fc7',
              background: 'linear-gradient(135deg, #4338ca 0%, #6d28d9 50%, #7c3aed 100%)',
              color: '#f5f3ff',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'inherit',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 0 12px rgba(124, 58, 237, 0.35)',
              transition: 'filter 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.filter = 'brightness(1.08)';
              el.style.boxShadow = '0 0 16px rgba(124, 58, 237, 0.5)';
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.filter = 'none';
              el.style.boxShadow = '0 0 12px rgba(124, 58, 237, 0.35)';
            }}
          >
            <span aria-hidden style={{ fontSize: 16 }}>✦</span>
            {advancedPlanning.label}
          </button>
        </div>
      )}
    </div>
  );
}
