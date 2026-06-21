import {
  useRef,
  useLayoutEffect,
  useState,
  useCallback,
  type CSSProperties,
  type ReactNode,
  type RefObject,
  type MutableRefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { useAppSession } from '../../context/AppSessionContext';
import { usePermissions } from '../../context/PermissionsContext';
import { getUnitsForPersona } from '../../data/catalog/units';
import type { UnitId, TestPersona } from '../../types/session';
import { getRoleLabel } from '../../types/roles';
import { DEFAULT_HEADER_LABELS } from '../../types/session';
import { figmaAssets } from '../../assets/figmaAssets';
import {
  USER_SETTINGS_PANEL_W,
  USER_SETTINGS_PANEL_H,
  PANEL_HEADER_H,
  FIELD_W,
  FIELD_H,
  FIELD_GROUP_H,
  LABEL_H,
  EMBLEM_SIZE,
  PLAN_W,
  PLAN_H,
  PANEL_LAYOUT,
  LOGOUT_BTN_W,
  LOGOUT_BTN_H,
} from './userSettingsLayout';

export { USER_SETTINGS_PANEL_W } from './userSettingsLayout';

const FONT = 'Assistant, var(--ds-font)';

const LABEL: CSSProperties = {
  margin: 0,
  height: LABEL_H,
  fontSize: 14,
  fontWeight: 400,
  lineHeight: 'normal',
  color: '#cddce7',
  textAlign: 'right',
  fontFamily: FONT,
  display: 'block',
};

const BOX: CSSProperties = {
  position: 'relative',
  width: FIELD_W,
  height: FIELD_H,
  background: '#343944',
  border: '1px solid #575f70',
  borderRadius: 4,
  boxSizing: 'border-box',
};

const READONLY_TEXT: CSSProperties = {
  position: 'absolute',
  inset: 0,
  padding: '0 8px',
  margin: 0,
  color: '#fff',
  fontSize: 14,
  fontWeight: 400,
  fontFamily: FONT,
  direction: 'rtl',
  textAlign: 'right',
  lineHeight: `${FIELD_H}px`,
  boxSizing: 'border-box',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const SELECT: CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  padding: '0 8px 0 26px',
  margin: 0,
  border: 'none',
  background: 'transparent',
  color: '#fff',
  fontSize: 14,
  fontWeight: 400,
  fontFamily: FONT,
  direction: 'rtl',
  textAlign: 'right',
  outline: 'none',
  cursor: 'pointer',
  appearance: 'none',
  WebkitAppearance: 'none',
  colorScheme: 'dark',
};

function FieldChevron() {
  return (
    <span
      style={{
        position: 'absolute',
        left: 4,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 20,
        height: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <img src={figmaAssets.userChevronV2} alt="" width={8} height={8} style={{ display: 'block' }} />
    </span>
  );
}

function FieldGroup({
  label,
  left,
  top,
  width = FIELD_W,
  tutorialId,
  children,
}: {
  label: string;
  left: number;
  top: number;
  width?: number;
  tutorialId?: string;
  children: ReactNode;
}) {
  return (
    <div
      data-tutorial-id={tutorialId}
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height: FIELD_GROUP_H,
      }}
    >
      <p style={LABEL}>{label}</p>
      <div style={{ marginTop: FIELD_GROUP_H - LABEL_H - FIELD_H }}>{children}</div>
    </div>
  );
}

/** Figma 504:106295 — ללא chevron */
function PlanFolderField({
  operationTitle,
  unitLabel,
  left,
  top,
}: {
  operationTitle: string;
  unitLabel: string;
  left: number;
  top: number;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width: PLAN_W,
        height: PLAN_H,
      }}
    >
      <p
        style={{
          ...LABEL,
          position: 'absolute',
          right: 0,
          top: 0,
          width: 108,
        }}
      >
        תיק + תוכנית
      </p>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: FIELD_H,
          background: '#343944',
          border: '1px solid #575f70',
          borderRadius: 4,
          boxSizing: 'border-box',
          padding: '0 8px',
        }}
      >
        <div
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 6,
            direction: 'rtl',
          }}
        >
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', fontFamily: FONT, whiteSpace: 'nowrap' }}>
            {operationTitle}
          </span>
          <span style={{ fontSize: 14, color: '#fff', fontFamily: FONT, whiteSpace: 'nowrap' }}>
            {unitLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

function PersonaSelect({
  value,
  personas,
  onChange,
  dropdownRef,
}: {
  value: string;
  personas: TestPersona[];
  onChange: (id: string) => void;
  dropdownRef: MutableRefObject<HTMLDivElement | null>;
}) {
  const [open, setOpen] = useState(false);
  const [btnRect, setBtnRect] = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const selected = personas.find(p => p.id === value) ?? personas[0];

  function handleToggle() {
    if (!open && btnRef.current) setBtnRect(btnRef.current.getBoundingClientRect());
    setOpen(o => !o);
  }

  function handleSelect(id: string) {
    onChange(id);
    setOpen(false);
  }

  useLayoutEffect(() => {
    if (!open) {
      dropdownRef.current = null;
      return;
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, dropdownRef]);

  return (
    <>
      <div style={BOX}>
        <button
          ref={btnRef}
          type="button"
          onClick={handleToggle}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            padding: '0 8px 0 26px',
            border: 'none',
            background: 'transparent',
            color: '#fff',
            fontSize: 14,
            fontFamily: FONT,
            direction: 'rtl',
            textAlign: 'right',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          {selected.name}
        </button>
        <FieldChevron />
      </div>
      {open &&
        btnRect &&
        createPortal(
          <div
            ref={el => {
              dropdownRef.current = el;
            }}
            style={{
              position: 'fixed',
              top: btnRect.bottom + 2,
              left: btnRect.left,
              width: btnRect.width,
              background: 'rgba(20, 21, 26, 0.95)',
              border: '1px solid #575f70',
              borderRadius: 4,
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
              zIndex: 2300,
              direction: 'rtl',
              overflow: 'hidden',
            }}
          >
            {personas.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelect(p.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  width: '100%',
                  padding: '3px 8px',
                  border: 'none',
                  borderBottom:
                    i < personas.length - 1 ? '1px solid rgba(87, 95, 112, 0.2)' : 'none',
                  background: p.id === value ? '#32363f' : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'right',
                  gap: 1,
                  fontFamily: FONT,
                }}
              >
                <span style={{ color: '#fff', fontSize: 12, lineHeight: '15px' }}>{p.name}</span>
                <span
                  style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, lineHeight: '12px' }}
                >
                  {p.description}
                </span>
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}

type Props = {
  anchorRect: DOMRect;
  triggerRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
};

export function UserSettingsPanel({ anchorRect, triggerRef, onClose }: Props) {
  const { session, switchUser, setUnit } = useAppSession();
  const { personas } = usePermissions();
  const panelRef = useRef<HTMLDivElement>(null);
  const personaDropdownRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const persona = personas.find(p => p.id === session.userId) ?? personas[0];
  const allowedUnits = getUnitsForPersona(persona.unitPermissions.map(up => up.unitId));
  const unitRoles = persona.unitPermissions.find(up => up.unitId === session.unitId)?.allowedRoleIds ?? ['guest'];
  const primaryRole = unitRoles.find(id => id !== 'guest') ?? 'guest';
  const roleLabel = getRoleLabel(primaryRole as import('../../types/roles').RoleId);
  const plan = DEFAULT_HEADER_LABELS;
  const cellName = persona.header?.cellName ?? plan.cellName;

  const updatePosition = useCallback(() => {
    const left = anchorRect.left + anchorRect.width / 2 - USER_SETTINGS_PANEL_W / 2;
    setPos({
      left: Math.max(8, Math.min(left, window.innerWidth - USER_SETTINGS_PANEL_W - 8)),
      top: anchorRect.bottom + 2,
    });
  }, [anchorRect]);

  useLayoutEffect(() => {
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [updatePosition]);

  useLayoutEffect(() => {
    function onPointerDown(e: PointerEvent) {
      const t = e.target as Node;
      if (panelRef.current?.contains(t)) return;
      if (triggerRef.current?.contains(t)) return;
      if (personaDropdownRef.current?.contains(t)) return;
      onClose();
    }
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [onClose, triggerRef]);

  useLayoutEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div
      ref={panelRef}
      className="user-settings-panel"
      role="dialog"
      aria-label="הגדרות משתמש"
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        width: USER_SETTINGS_PANEL_W,
        height: USER_SETTINGS_PANEL_H,
        backdropFilter: 'blur(2.192px)',
        background: 'rgba(20, 21, 26, 0.9)',
        borderRadius: 8,
        boxShadow: '0 1.253px 12.526px 1.253px rgba(0, 0, 0, 0.4)',
        zIndex: 2200,
        direction: 'rtl',
        fontFamily: FONT,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: PANEL_HEADER_H,
          background: 'rgba(20, 21, 26, 0.9)',
          borderBottom: '1px solid #000',
          boxShadow: '0 0 4px rgba(0, 0, 0, 0.25)',
          borderRadius: '8px 8px 0 0',
          boxSizing: 'border-box',
          direction: 'ltr',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingRight: 11.5,
        }}
      >
        <span
          style={{
            width: 124.5,
            fontSize: 16,
            fontWeight: 400,
            color: '#dceaf3',
            lineHeight: 'normal',
            textAlign: 'right',
          }}
        >
          הגדרות משתמש
        </span>
      </div>

      <div style={{ position: 'relative', height: USER_SETTINGS_PANEL_H - PANEL_HEADER_H }}>
        <div
          style={{
            position: 'absolute',
            left: PANEL_LAYOUT.emblem.left,
            top: PANEL_LAYOUT.emblem.top,
            width: EMBLEM_SIZE,
            height: EMBLEM_SIZE,
            background: '#3d424f',
            borderRadius: 4,
            overflow: 'hidden',
            zIndex: 1,
          }}
        >
          <img
            src={figmaAssets.userEmblemBgV2}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          />
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, calc(-50% + 1px))',
              width: 26,
              height: 36,
              overflow: 'hidden',
              borderRadius: '2px 2px 0 0',
            }}
          >
            <img
              src={figmaAssets.userEmblemV2}
              alt=""
              style={{
                display: 'block',
                width: '100%',
                height: 'auto',
                minHeight: '100%',
                marginTop: -2,
              }}
            />
          </div>
        </div>

        <FieldGroup label="תא" left={PANEL_LAYOUT.cell.left} top={PANEL_LAYOUT.cell.top}>
          <div style={BOX}>
            <div style={{ ...READONLY_TEXT, cursor: 'default' }} title={cellName}>
              {cellName}
            </div>
          </div>
        </FieldGroup>

        <FieldGroup
          label="יחידה"
          left={PANEL_LAYOUT.unit.left}
          top={PANEL_LAYOUT.unit.top}
          tutorialId="user-settings-unit"
        >
          <div style={BOX}>
            <select
              value={session.unitId}
              onChange={e => setUnit(e.target.value as UnitId)}
              style={SELECT}
              aria-label="יחידה"
            >
              {allowedUnits.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
            <FieldChevron />
          </div>
        </FieldGroup>

        <FieldGroup
          label="משתמש"
          left={PANEL_LAYOUT.user.left}
          top={PANEL_LAYOUT.user.top}
          tutorialId="user-settings-user"
        >
          <PersonaSelect
            value={session.userId}
            personas={personas}
            onChange={id => switchUser(id)}
            dropdownRef={personaDropdownRef}
          />
        </FieldGroup>

        <PlanFolderField
          left={PANEL_LAYOUT.plan.left}
          top={PANEL_LAYOUT.plan.top}
          operationTitle={plan.operationTitle}
          unitLabel={plan.unitLabel}
        />

        <FieldGroup label="מציאות" left={PANEL_LAYOUT.reality.left} top={PANEL_LAYOUT.reality.top}>
          <div style={BOX}>
            <div style={{ ...READONLY_TEXT, cursor: 'default' }}>מבצעית</div>
          </div>
        </FieldGroup>

        <FieldGroup label="תפקיד" left={PANEL_LAYOUT.role.left} top={PANEL_LAYOUT.role.top}>
          <div style={BOX}>
            <div style={{ ...READONLY_TEXT, cursor: 'default' }} title={roleLabel}>
              {roleLabel}
            </div>
          </div>
        </FieldGroup>

        {/* Figma 504:106296 */}
        <button
          type="button"
          style={{
            position: 'absolute',
            left: PANEL_LAYOUT.logout.left,
            top: PANEL_LAYOUT.logout.top,
            width: LOGOUT_BTN_W,
            height: LOGOUT_BTN_H,
            padding: '0 12px',
            border: 'none',
            borderRadius: 6,
            background: '#ff0c0c',
            color: '#14151a',
            fontSize: 12,
            fontWeight: 600,
            fontFamily: FONT,
            cursor: 'pointer',
            lineHeight: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
          }}
        >
          התנתק
        </button>
      </div>
    </div>,
    document.body,
  );
}
