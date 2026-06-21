import { useLayoutEffect, useState, useCallback, useMemo, type MutableRefObject } from 'react';
import { createPortal } from 'react-dom';
import type { RoleCategory } from '../../types/roles';
import { useAppSession } from '../../context/AppSessionContext';
import { LockIcon } from '../Icons';
import { getMissionPlanCategoryIcon } from './missionPlanIcons';
import {
  MISSION_PLAN_DROPDOWN_OFFSET_TOP,
  MISSION_PLAN_DROPDOWN_OFFSET_RIGHT,
  MISSION_PLAN_ROW_H,
  MISSION_PLAN_ICON,
  MISSION_PLAN_PANEL_PAD_X,
  MISSION_PLAN_PANEL_PAD_Y,
  MISSION_PLAN_PANEL_MAX_H,
} from './missionPlanIcons';
import { getUnit } from '../../data/catalog/units';
import { getMissionPlanEffortMenu, type EffortMenuItem } from '../../utils/missionPlanRoles';
import type { UnitId } from '../../types/session';
import {
  MP_FONT_FAMILY,
  MP_TEXT_ACTIVE,
  MP_TEXT_ROW,
  MP_TEXT_CATEGORY,
  MP_TEXT_SIZE,
  MP_CATEGORY_SIZE,
} from './missionPlanTypography';
import { useDesignScaleValue } from '../../context/DesignScaleContext';

type Props = {
  anchorRect: DOMRect;
  panelRef?: MutableRefObject<HTMLDivElement | null>;
  activeEffort: RoleCategory | null;
  userId: string;
  unitId: UnitId;
  onSelectEffort: (effort: RoleCategory | null) => void;
};

function px(n: number, scale: number): number {
  return n * scale;
}

/** Mission Plan dropdown — effort selection redesign */
export function MissionPlanDropdown({
  anchorRect,
  panelRef: panelRefProp,
  activeEffort,
  userId,
  unitId,
  onSelectEffort,
}: Props) {
  const scale = useDesignScaleValue();
  const setPanelRef = (el: HTMLDivElement | null) => {
    if (panelRefProp) panelRefProp.current = el;
  };
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [hoveredEffort, setHoveredEffort] = useState<RoleCategory | null>(null);
  const [openInfoEffort, setOpenInfoEffort] = useState<RoleCategory | null>(null);

  const { session } = useAppSession();
  const allowedRoleIds = session.allowedRoleIds;
  const unitLevel = getUnit(unitId).level;
  const menu = getMissionPlanEffortMenu({ allowedRoleIds }, unitLevel);

  const s = useMemo(
    () => ({
      panelW: anchorRect.width,
      rowH: px(MISSION_PLAN_ROW_H, scale),
      icon: px(MISSION_PLAN_ICON, scale),
      padX: px(MISSION_PLAN_PANEL_PAD_X, scale),
      padY: px(MISSION_PLAN_PANEL_PAD_Y, scale),
      gap: px(6, scale),
      rowGap: px(3, scale),
      rowPadX: px(8, scale),
      radius: px(4, scale),
      panelRadius: px(10, scale),
      maxH: px(MISSION_PLAN_PANEL_MAX_H, scale),
      offsetTop: px(MISSION_PLAN_DROPDOWN_OFFSET_TOP, scale),
      offsetRight: px(MISSION_PLAN_DROPDOWN_OFFSET_RIGHT, scale),
      textActive: { ...MP_TEXT_ACTIVE, fontSize: px(MP_TEXT_SIZE, scale) },
      textRow: { ...MP_TEXT_ROW, fontSize: px(MP_TEXT_SIZE, scale) },
      textCategory: { ...MP_TEXT_CATEGORY, fontSize: px(MP_CATEGORY_SIZE, scale) },
      lockSize: px(10, scale),
      infoSize: px(14, scale),
      infoRoleSize: px(px(10, scale), 1),
    }),
    [anchorRect.width, scale],
  );

  const updatePosition = useCallback(() => {
    setPos({
      top: anchorRect.bottom + s.offsetTop,
      left: anchorRect.right + s.offsetRight - s.panelW,
    });
  }, [anchorRect, s.offsetTop, s.offsetRight, s.panelW]);

  useLayoutEffect(() => {
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [updatePosition]);

  function handleInfoClick(e: React.MouseEvent, effort: RoleCategory) {
    e.stopPropagation();
    setOpenInfoEffort(prev => (prev === effort ? null : effort));
  }

  function renderInfoPanel(item: EffortMenuItem) {
    return (
      <div
        style={{
          padding: `${px(4, scale)}px ${px(8, scale)}px ${px(6, scale)}px`,
          background: 'rgba(30, 33, 40, 0.95)',
          borderTop: '1px solid rgba(87, 95, 112, 0.3)',
          direction: 'rtl',
        }}
      >
        {item.roles.map(role => (
          <div
            key={role.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: px(6, scale),
              padding: `${px(2, scale)}px 0`,
            }}
          >
            <span
              style={{
                width: px(6, scale),
                height: px(6, scale),
                borderRadius: '50%',
                background: role.allowed ? '#4caf7d' : 'rgba(255,255,255,0.15)',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: px(10, scale),
                color: role.allowed ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)',
                fontFamily: MP_FONT_FAMILY,
                lineHeight: 1.3,
                textAlign: 'right',
              }}
            >
              {role.label}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return createPortal(
    <div
      ref={setPanelRef}
      data-tutorial-id="mission-plan-dropdown"
      className="mission-plan-dropdown"
      role="listbox"
      aria-label="בחירת מאמץ"
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        width: s.panelW,
        maxHeight: s.maxH,
        overflowY: 'auto',
        overflowX: 'hidden',
        backdropFilter: 'blur(3.5px)',
        background: 'rgba(20, 21, 26, 0.9)',
        borderRadius: s.panelRadius,
        boxShadow: '0 2px 20px 2px rgba(0, 0, 0, 0.4)',
        zIndex: 2200,
        direction: 'rtl',
        fontFamily: MP_FONT_FAMILY,
        padding: `${s.padY}px ${s.padX}px`,
        boxSizing: 'border-box',
      }}
    >
      {menu.map((item, index) => {
        const isActive = activeEffort === item.id;
        const locked = item.state === 'locked';
        const isHovered = hoveredEffort === item.id;
        const infoOpen = openInfoEffort === item.id;

        return (
          <div
            key={item.id}
            style={{ marginTop: index === 0 ? 0 : s.rowGap }}
          >
            {/* שורת מאמץ */}
            <div
              style={{ position: 'relative' }}
              onMouseEnter={() => setHoveredEffort(item.id)}
              onMouseLeave={() => setHoveredEffort(null)}
            >
              <button
                type="button"
                role="option"
                aria-selected={isActive}
                aria-disabled={locked}
                disabled={locked}
                onClick={() => {
                  if (locked) return;
                  onSelectEffort(isActive ? null : item.id);
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  gap: s.gap,
                  width: '100%',
                  height: s.rowH,
                  padding: `0 ${s.rowPadX}px`,
                  border: locked ? '1px dashed rgba(107, 114, 128, 0.45)' : 'none',
                  borderRadius: s.radius,
                  background: isActive ? '#32363f' : '#343944',
                  opacity: locked ? 0.5 : isActive ? 1 : 0.75,
                  boxShadow: '0 0 4px rgba(0, 0, 0, 0.3)',
                  cursor: locked ? 'not-allowed' : 'pointer',
                  fontFamily: MP_FONT_FAMILY,
                  boxSizing: 'border-box',
                  outline: 'none',
                  paddingLeft: s.rowPadX + (isHovered && !locked ? px(20, scale) : 0),
                  transition: 'padding-left 0.1s ease',
                }}
              >
                <img
                  src={getMissionPlanCategoryIcon(item.id)}
                  alt=""
                  width={s.icon}
                  height={s.icon}
                  style={{ flexShrink: 0, objectFit: 'contain', opacity: locked ? 0.5 : 1 }}
                />
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    ...(isActive ? s.textActive : s.textRow),
                    color: isActive ? MP_TEXT_ACTIVE.color : locked ? '#9ca3af' : MP_TEXT_ROW.color,
                    textAlign: 'right',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.label}
                </span>
                {locked && (
                  <span style={{ flexShrink: 0, display: 'flex' }}>
                    <LockIcon size={s.lockSize} color="#6b7280" />
                  </span>
                )}
              </button>

              {/* כפתור "i" — מופיע בריחוף, בצד שמאל */}
              {isHovered && !locked && (
                <button
                  type="button"
                  onClick={e => handleInfoClick(e, item.id)}
                  title={`מידע על תפקידים ב${item.label}`}
                  style={{
                    position: 'absolute',
                    left: px(4, scale),
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: px(16, scale),
                    height: px(16, scale),
                    border: `1px solid ${infoOpen ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)'}`,
                    borderRadius: '50%',
                    background: infoOpen ? 'rgba(255,255,255,0.12)' : 'transparent',
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: px(9, scale),
                    fontWeight: 700,
                    fontFamily: MP_FONT_FAMILY,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    lineHeight: 1,
                    zIndex: 1,
                  }}
                >
                  i
                </button>
              )}
            </div>

            {/* פאנל מידע — רשימת תפקידים */}
            {infoOpen && renderInfoPanel(item)}
          </div>
        );
      })}
    </div>,
    document.body,
  );
}
