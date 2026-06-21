import { useState, useRef, useLayoutEffect, useCallback, useEffect } from 'react';
import { useAppSession } from '../../context/AppSessionContext';
import { useTutorial } from '../../context/TutorialContext';
import type { RoleCategory } from '../../types/roles';
import { ROLE_CATEGORIES } from '../../types/roles';
import { figmaAssets } from '../../assets/figmaAssets';
import { MissionPlanDropdown } from './MissionPlanDropdown';
import { getMissionPlanCategoryIcon } from './missionPlanIcons';
import {
  MISSION_PLAN_BUTTON_W,
  MISSION_PLAN_BUTTON_H,
} from './missionPlanIcons';
import { MP_FONT_FAMILY, MP_TEXT_ACTIVE } from './missionPlanTypography';

const CHEVRON = 18;

/** Mission Plan — Figma 392:30665 */
export function MissionPlanButton() {
  const { session, setActiveEffort } = useAppSession();
  const { registerMissionPlanChrome } = useTutorial();
  const [open, setOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const effort = session.activeEffort;
  const titleLine = effort
    ? (ROLE_CATEGORIES.find(c => c.id === effort)?.label ?? effort)
    : 'בחר מאמץ';
  const roleIcon = effort ? getMissionPlanCategoryIcon(effort) : null;

  const close = useCallback(() => setOpen(false), []);

  useLayoutEffect(() => {
    function onPointerDown(e: PointerEvent) {
      const t = e.target as Node;
      if (rootRef.current?.contains(t)) return;
      if (dropdownRef.current?.contains(t)) return;
      close();
    }
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [close]);

  const toggle = useCallback(() => {
    setOpen(prev => {
      if (prev) return false;
      if (btnRef.current) setAnchorRect(btnRef.current.getBoundingClientRect());
      return true;
    });
  }, []);

  const openDropdown = useCallback(() => {
    if (btnRef.current) setAnchorRect(btnRef.current.getBoundingClientRect());
    setOpen(true);
  }, []);

  useEffect(() => {
    registerMissionPlanChrome({ open: openDropdown, close });
    return () => registerMissionPlanChrome(null);
  }, [registerMissionPlanChrome, openDropdown, close]);

  return (
    <div
      ref={rootRef}
      data-tutorial-id="mission-plan-button"
      style={{ position: 'relative', width: MISSION_PLAN_BUTTON_W, height: MISSION_PLAN_BUTTON_H }}
    >
      <button
        ref={btnRef}
        type="button"
        onClick={e => {
          e.stopPropagation();
          toggle();
        }}
        aria-expanded={open}
        aria-haspopup="listbox"
        title="בחירת תפקיד"
        style={{
          position: 'relative',
          width: MISSION_PLAN_BUTTON_W,
          height: MISSION_PLAN_BUTTON_H,
          margin: 0,
          padding: 0,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          fontFamily: MP_FONT_FAMILY,
        }}
      >
        <img
          src={figmaAssets.missionPlanBg}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'fill',
            pointerEvents: 'none',
          }}
        />

        {/* chevron — Figma left 8% */}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: `translateY(-50%)${open ? ' rotate(180deg)' : ''}`,
            width: CHEVRON,
            height: CHEVRON,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.15s ease',
            pointerEvents: 'none',
          }}
        >
          <img
            src={figmaAssets.missionPlanChevron}
            alt=""
            style={{ width: 8, height: 8, display: 'block' }}
          />
        </span>

        {/* תג אייקון — Figma inset 12.17% / 83.05% left */}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: 149,
            top: 5,
            width: 29,
            height: 29,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              position: 'absolute',
              inset: '-7%',
              borderRadius: 4,
              background: 'rgba(52, 57, 68, 0.9)',
            }}
          />
          <img
            src={roleIcon ?? figmaAssets.missionTarget}
            alt=""
            style={{
              position: 'relative',
              width: 22,
              height: 22,
              objectFit: 'contain',
            }}
          />
        </span>

        {/* שם תפקיד — Figma 312:145225, שורה אחת */}
        <span
          style={{
            position: 'absolute',
            left: 58,
            right: 38,
            top: 8,
            bottom: 9,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            pointerEvents: 'none',
            direction: 'rtl',
          }}
        >
          <span
            style={{
              ...MP_TEXT_ACTIVE,
              textAlign: 'right',
              whiteSpace: 'nowrap',
            }}
          >
            {titleLine}
          </span>
        </span>
      </button>

      {open && anchorRect && (
        <MissionPlanDropdown
          anchorRect={anchorRect}
          panelRef={dropdownRef}
          activeEffort={session.activeEffort}
          unitId={session.unitId}
          onSelectEffort={(effort: RoleCategory | null) => {
            setActiveEffort(effort);
            close();
          }}
        />
      )}
    </div>
  );
}
