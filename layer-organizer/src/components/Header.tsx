import { useState, useRef, useEffect } from 'react';
import { useLayerOrganizer } from '../context/LayerOrganizerContext';
import { EyeOpenIcon, EyeOffIcon, EditIcon, LabelIcon, TankIcon, FlagIcon, BuildingIcon } from './Icons';
import { DotsMenu } from './DotsMenu';
import type { VisibilityLevel } from '../types';

// הסדר: מהכי מפורט (טכנו טקטי) להכי גבוה (מפקדה)
// מפקדה = index 2 → רואה הכל (כולל מפקדה טקטית וטכנו טקטי)
// טכנו טקטי = index 0 → רואה רק שכבות עד אותו דרג
const LEVEL_DEFS: { level: VisibilityLevel; tooltip: string; color: string; Icon: typeof TankIcon }[] = [
  { level: 'techno-tactical', tooltip: 'טכנו טקטי', color: '#22c55e', Icon: TankIcon },
  { level: 'tactical-hq', tooltip: 'מפקדה טקטית', color: '#eab308', Icon: FlagIcon },
  { level: 'hq-only', tooltip: 'מפקדה', color: '#ef4444', Icon: BuildingIcon },
];

// מחשב איזו רמה נבחרה (הגבוהה ביותר שדלוקה)
function getSelectedLevel(filters: Record<VisibilityLevel, boolean>): VisibilityLevel {
  if (filters['hq-only'])     return 'hq-only';
  if (filters['tactical-hq']) return 'tactical-hq';
  return 'techno-tactical';
}

export function Header() {
  const { state, toggleMode, setViewLevel, setGlobalSmartEye, setGlobalAllLayers, toggleLabels } = useLayerOrganizer();
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) setAddMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);
  const isNihuk = state.mode === 'nihuk';
  const globalEyeOff = state.globalEyeOff;

  const dotsItems = [
    {
      label: 'הדלק את כל המרשמים',
      icon: '◉',
      onClick: () => setGlobalAllLayers(true),
    },
    {
      label: 'כבה את כל המרשמים',
      icon: '○',
      onClick: () => setGlobalAllLayers(false),
    },
  ];

  return (
    <div
      style={{
        background: 'var(--ds-organizer-header)',
        borderBottom: '1px solid var(--ds-organizer-border)',
        flexShrink: 0,
      }}
    >
      {/* row 1: עריכה בשמאל, תכנון/ניהו"ק מימין (ריווח מכפתור שכבות) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px var(--ds-org-layers-strip) 10px 12px',
          direction: 'rtl',
          gap: 8,
        }}
      >
        <button
          type="button"
          data-tutorial-id="organizer-global-edit"
          title="עריכה כללית"
          style={{
            flexShrink: 0,
            background: 'none',
            border: '1px solid var(--ds-organizer-border)',
            borderRadius: 4,
            padding: '5px 9px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <EditIcon size={16} color="var(--ds-text-secondary)" />
        </button>
        <div
          data-tutorial-id="organizer-mode-switch"
          style={{
            marginInlineStart: 'auto',
            display: 'flex',
            alignItems: 'center',
            background: 'var(--ds-organizer-content)',
            borderRadius: 20,
            padding: 3,
            border: '1px solid var(--ds-organizer-border)',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={() => !isNihuk && toggleMode()}
            style={{
              padding: '5px 12px', borderRadius: 18, border: 'none',
              cursor: isNihuk ? 'default' : 'pointer', fontSize: 'var(--ds-org-text-sm)', fontWeight: 600, fontFamily: 'inherit',
              background: isNihuk ? 'linear-gradient(135deg,#1e40af,#1e90ff)' : 'none',
              color: isNihuk ? '#fff' : 'var(--ds-text-muted)', transition: 'all 0.2s',
              boxShadow: isNihuk ? '0 0 8px #1e90ff44' : 'none',
            }}
          >ניהו"ק</button>
          <button
            type="button"
            data-tutorial-id="organizer-planning-mode"
            onClick={() => isNihuk && toggleMode()}
            style={{
              padding: '5px 12px', borderRadius: 18, border: 'none',
              cursor: !isNihuk ? 'default' : 'pointer', fontSize: 'var(--ds-org-text-sm)', fontWeight: 600, fontFamily: 'inherit',
              background: !isNihuk ? 'linear-gradient(135deg,#6d28d9,#a855f7)' : 'none',
              color: !isNihuk ? '#fff' : 'var(--ds-text-muted)', transition: 'all 0.2s',
              boxShadow: !isNihuk ? '0 0 8px #a855f744' : 'none',
            }}
          >תכנון</button>
        </div>
      </div>

      {/* row 2: global controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '7px 12px 8px',
          direction: 'rtl',
          gap: 6,
          borderTop: '1px solid var(--ds-organizer-border)',
        }}
      >

        {/* RIGHT: + button with dropdown */}
        <div ref={addMenuRef} data-tutorial-id="organizer-global-add" style={{ position: 'relative' }}>
          <button
            onClick={() => setAddMenuOpen(o => !o)}
            title="הוספת קבוצת שכבות"
            style={{
              background: addMenuOpen ? 'var(--ds-organizer-hover)' : 'none',
              border: `1px solid ${addMenuOpen ? 'var(--ds-border-muted)' : 'var(--ds-organizer-border)'}`,
              borderRadius: 4,
              padding: '3px 10px', cursor: 'pointer', fontSize: 'var(--ds-org-text-xl)', fontWeight: 700,
              color: addMenuOpen ? 'var(--ds-text-heading)' : 'var(--ds-text-muted)', lineHeight: 1,
              display: 'flex', alignItems: 'center', transition: 'all 0.15s',
            }}
          >+</button>

          {addMenuOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 5px)',
              right: 0,
              background: 'var(--ds-organizer-surface)',
              border: '1px solid var(--ds-organizer-border)',
              borderRadius: 6,
              boxShadow: '0 6px 24px rgba(0,0,0,0.6)',
              zIndex: 500,
              minWidth: 170,
              direction: 'rtl',
              overflow: 'hidden',
            }}>
              {[
                { label: 'הוספת תוכנית' },
                { label: 'הוספת ניהו"ק יחידות אחרות' },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => setAddMenuOpen(false)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'right',
                    padding: '8px 14px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 'var(--ds-org-text-base)', color: 'var(--ds-text-secondary)', fontFamily: 'inherit',
                    borderBottom: '1px solid var(--ds-organizer-border)',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--ds-organizer-hover)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'none')}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <span style={{ color: 'var(--ds-organizer-border)', fontSize: 'var(--ds-org-text-md)', userSelect: 'none', flexShrink: 0 }}>|</span>

        {/* cascade level selector */}
        {(() => {
          const selected = getSelectedLevel(state.visibilityFilters);
          const selectedIdx = LEVEL_DEFS.findIndex(d => d.level === selected);
          return (
            <div data-tutorial-id="organizer-view-level" style={{ display: 'flex', alignItems: 'center', direction: 'ltr' }}>
              {LEVEL_DEFS.map((def, i) => {
                const isActive = i <= selectedIdx;
                const isSelected = i === selectedIdx;
                const isFirst = i === 0;
                const isLast = i === LEVEL_DEFS.length - 1;
                return (
                  <button
                    key={def.level}
                    type="button"
                    onClick={() => setViewLevel(def.level)}
                    title={def.tooltip}
                    aria-label={def.tooltip}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '5px 7px',
                      minWidth: 32,
                      border: `1px solid ${isActive ? def.color + '66' : 'var(--ds-organizer-border)'}`,
                      borderLeft: !isLast ? 'none' : `1px solid ${isActive ? def.color + '66' : 'var(--ds-organizer-border)'}`,
                      borderRadius: isFirst ? '0 4px 4px 0' : isLast ? '4px 0 0 4px' : 0,
                      background: isSelected ? `${def.color}30` : isActive ? `${def.color}14` : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      boxShadow: isSelected ? `0 0 6px ${def.color}44` : 'none',
                    }}
                  >
                    <def.Icon size={16} color={isActive ? def.color : 'var(--ds-text-muted)'} />
                  </button>
                );
              })}
            </div>
          );
        })()}

        {/* spacer — pushes left group to the left */}
        <div style={{ flex: 1 }} />

        {/* LEFT: label toggle + eye + dots */}
        <button
          data-tutorial-id="organizer-global-labels"
          onClick={toggleLabels}
          title="הצג/הסתר טקסט"
          style={{
            background: state.labelsHidden ? 'var(--ds-organizer-hover)' : 'none',
            border: `1px solid ${state.labelsHidden ? 'var(--ds-border-muted)' : 'var(--ds-organizer-border)'}`,
            borderRadius: 4, padding: '5px 8px', cursor: 'pointer',
            display: 'flex', alignItems: 'center',
          }}
        >
          <LabelIcon size={18} color={state.labelsHidden ? 'var(--ds-text-heading)' : 'var(--ds-text-muted)'} />
        </button>

        <button
          data-tutorial-id="organizer-global-eye"
          onClick={() => setGlobalSmartEye(!globalEyeOff)}
          title={globalEyeOff ? 'שחזר מצב שכבות' : 'הסתר הכל (שמור מצב)'}
          style={{
            background: 'none', border: '1px solid var(--ds-organizer-border)',
            borderRadius: 4, padding: '5px 8px', cursor: 'pointer',
            display: 'flex', alignItems: 'center',
          }}
        >
          {globalEyeOff
            ? <EyeOffIcon size={18} color="var(--ds-text-muted)" />
            : <EyeOpenIcon size={18} color="var(--ds-text-heading)" />
          }
        </button>

        <DotsMenu items={dotsItems} align="left" tutorialId="organizer-global-dots" />
      </div>
    </div>
  );
}
