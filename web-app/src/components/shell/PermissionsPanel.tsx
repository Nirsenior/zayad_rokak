import { useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import type { CSSProperties } from 'react';
import { usePermissions } from '../../context/PermissionsContext';
import { ROLE_CATEGORIES, getRoleCategory, ALL_ROLE_IDS } from '../../types/roles';
import type { RoleId, RoleCategory } from '../../types/roles';
import type { TestPersona, UnitId, PersonaUnitPermission } from '../../types/session';
import { UNITS, getUnit } from '../../data/catalog/units';
import { isTikshuvRole, isRoleAllowedAtUnit } from '../../data/rules/tikshuvRoleAccess';
import { HEADER_H, MAIN_MENU_W } from './shellLayout';

const FONT = 'Assistant, var(--ds-font)';
const BG = 'rgba(13, 15, 20, 0.97)';
const BORDER = 'rgba(87, 95, 112, 0.4)';
const ROW_HOVER = 'rgba(255,255,255,0.05)';
const ACTIVE_BG = 'rgba(76, 138, 247, 0.14)';
const ACCENT = '#4c8af7';
const TEXT = '#f0f4ff';
const TEXT_DIM = 'rgba(255,255,255,0.7)';
const RED = '#ef5350';

const EFFORT_COLORS: Record<RoleCategory, string> = {
  orekh: '#b0b0b0',
  agam: '#6db86d',
  oref: '#c48a5e',
  modiin: '#6b8ec4',
  esh: '#c46b6b',
  tikshuv: '#5fa8c4',
  manhala: '#c4b06b',
};

function badgeStyle(color: string, active = false): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 9px',
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 600,
    background: active ? `${color}44` : `${color}28`,
    border: `1px solid ${active ? color : color + '66'}`,
    color,
    whiteSpace: 'nowrap',
    fontFamily: FONT,
    cursor: 'pointer',
    outline: 'none',
    boxShadow: active ? `0 0 0 1px ${color}` : 'none',
  };
}

function Btn({ children, onClick, danger, secondary, small }: {
  children: React.ReactNode; onClick?: () => void;
  danger?: boolean; secondary?: boolean; small?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: small ? '2px 10px' : '5px 14px',
      border: danger ? `1px solid ${RED}66` : `1px solid ${BORDER}`,
      borderRadius: 5,
      background: danger ? `${RED}18` : secondary ? 'transparent' : ACCENT,
      color: danger ? RED : secondary ? TEXT_DIM : '#fff',
      fontSize: small ? 11 : 12, fontFamily: FONT, cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap',
    }}>{children}</button>
  );
}

function newId(): string { return 'user-' + Date.now().toString(36); }

/** תפקידים זמינים לבחירה ביחידה לפי דרגה */
function getAvailableRoles(unitId: UnitId): RoleId[] {
  const level = getUnit(unitId).level;
  return (ALL_ROLE_IDS as RoleId[]).filter(id => {
    if (id === 'guest') return false;
    if (isTikshuvRole(id)) return isRoleAllowedAtUnit(id, level);
    return true;
  });
}

// ─── Effort Roles Popover ─────────────────────────────────────────────────────
type EffortPopoverState = { personaId: string; effortId: RoleCategory; unitId: UnitId; rect: DOMRect };

function EffortRolesPopover({ popover, persona, onClose }: {
  popover: EffortPopoverState; persona: TestPersona; onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const cat = ROLE_CATEGORIES.find(c => c.id === popover.effortId);
  const color = EFFORT_COLORS[popover.effortId] ?? '#888';
  const unitRoleIds = persona.unitPermissions.find(up => up.unitId === popover.unitId)?.allowedRoleIds ?? ['guest'];
  const availableRoles = getAvailableRoles(popover.unitId);

  useLayoutEffect(() => {
    function onDown(e: PointerEvent) { if (!ref.current?.contains(e.target as Node)) onClose(); }
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, [onClose]);

  const POPOVER_W = 210;
  const top = popover.rect.bottom + 6;
  const left = Math.max(8, Math.min(popover.rect.left, window.innerWidth - POPOVER_W - 8));

  const rolesInEffort = cat?.roles.filter(r => availableRoles.includes(r.id)) ?? cat?.roles ?? [];

  return createPortal(
    <div ref={ref} style={{
      position: 'fixed', top, left, width: POPOVER_W,
      background: 'rgba(18, 20, 28, 0.98)', border: `1px solid ${color}55`,
      borderRadius: 8, boxShadow: '0 6px 24px rgba(0,0,0,0.6)', zIndex: 2500,
      direction: 'rtl', fontFamily: FONT, overflow: 'hidden',
    }}>
      <div style={{ padding: '7px 12px 5px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{cat?.label}</span>
        <span style={{ fontSize: 11, color: TEXT_DIM, marginRight: 'auto' }}>{UNITS.find(u => u.id === popover.unitId)?.name}</span>
      </div>
      <div style={{ padding: '6px 0 4px' }}>
        {rolesInEffort.length === 0 && (
          <div style={{ padding: '4px 12px', fontSize: 12, color: TEXT_DIM }}>אין תפקידים בדרג זה</div>
        )}
        {rolesInEffort.map(role => {
          const has = unitRoleIds.includes(role.id);
          return (
            <div key={role.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px', direction: 'rtl' }}>
              <span style={{
                width: 14, height: 14, borderRadius: '50%',
                background: has ? '#4caf7d' : 'rgba(255,255,255,0.1)',
                border: `1.5px solid ${has ? '#4caf7d' : 'rgba(255,255,255,0.2)'}`,
                flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff',
              }}>{has ? '✓' : ''}</span>
              <span style={{ fontSize: 12, color: has ? TEXT : 'rgba(255,255,255,0.4)', fontFamily: FONT }}>{role.label}</span>
            </div>
          );
        })}
      </div>
    </div>,
    document.body,
  );
}

// ─── RoleEditor ───────────────────────────────────────────────────────────────
type EditState = {
  id: string; name: string; description: string;
  unitPermissions: PersonaUnitPermission[];
  defaultUnitId: UnitId;
};

function toEditState(p: TestPersona): EditState {
  return { id: p.id, name: p.name, description: p.description, unitPermissions: p.unitPermissions.map(up => ({ ...up, allowedRoleIds: [...up.allowedRoleIds] })), defaultUnitId: p.defaultUnitId };
}

function fromEditState(e: EditState): TestPersona {
  return { id: e.id, name: e.name, description: e.description, unitPermissions: e.unitPermissions, defaultUnitId: e.defaultUnitId };
}

function RoleEditor({ edit, selectedUnit, onChange }: {
  edit: EditState; selectedUnit: UnitId; onChange: (e: EditState) => void;
}) {
  const unitPerm = edit.unitPermissions.find(up => up.unitId === selectedUnit);
  const hasUnit = !!unitPerm;
  const unitRoles = unitPerm?.allowedRoleIds ?? ['guest'];
  const available = getAvailableRoles(selectedUnit);

  function toggleUnit() {
    if (hasUnit) {
      onChange({ ...edit, unitPermissions: edit.unitPermissions.filter(up => up.unitId !== selectedUnit) });
    } else {
      onChange({ ...edit, unitPermissions: [...edit.unitPermissions, { unitId: selectedUnit, allowedRoleIds: ['guest'] }] });
    }
  }

  function toggleRole(roleId: RoleId) {
    if (roleId === 'guest') return;
    const newRoles = unitRoles.includes(roleId)
      ? unitRoles.filter(id => id !== roleId)
      : [...unitRoles, roleId];
    const updated = edit.unitPermissions.map(up =>
      up.unitId === selectedUnit ? { ...up, allowedRoleIds: newRoles } : up
    );
    onChange({ ...edit, unitPermissions: updated });
  }

  const unitName = UNITS.find(u => u.id === selectedUnit)?.name ?? selectedUnit;

  return (
    <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderTop: `1px solid ${BORDER}`, direction: 'rtl' }}>
      {/* שם ותיאור */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 11, color: TEXT_DIM, marginBottom: 3, fontFamily: FONT }}>שם</label>
          <input value={edit.name} onChange={e => onChange({ ...edit, name: e.target.value })}
            style={{ width: '100%', padding: '4px 8px', background: 'rgba(0,0,0,0.3)', border: `1px solid ${BORDER}`, borderRadius: 4, color: TEXT, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', direction: 'rtl', outline: 'none' }} />
        </div>
        <div style={{ flex: 2 }}>
          <label style={{ display: 'block', fontSize: 11, color: TEXT_DIM, marginBottom: 3, fontFamily: FONT }}>תיאור / תפקיד</label>
          <input value={edit.description} onChange={e => onChange({ ...edit, description: e.target.value })}
            style={{ width: '100%', padding: '4px 8px', background: 'rgba(0,0,0,0.3)', border: `1px solid ${BORDER}`, borderRadius: 4, color: TEXT, fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', direction: 'rtl', outline: 'none' }} />
        </div>
      </div>

      {/* גישה ליחידה */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none', direction: 'rtl' }}>
          <input type="checkbox" checked={hasUnit} onChange={toggleUnit} style={{ accentColor: ACCENT, cursor: 'pointer' }} />
          <span style={{ fontSize: 13, color: hasUnit ? TEXT : TEXT_DIM, fontFamily: FONT, fontWeight: 600 }}>
            גישה ל{unitName}
          </span>
        </label>
      </div>

      {/* תפקידים ביחידה זו */}
      {hasUnit && (
        <>
          <p style={{ fontSize: 12, color: TEXT_DIM, margin: '0 0 8px', fontFamily: FONT, fontWeight: 600 }}>
            תפקידים ב{unitName} (דרג: {getUnit(selectedUnit).level === 'gdud' ? 'גדוד' : getUnit(selectedUnit).level === 'hativa' ? 'חטיבה' : 'אוגדה'})
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10 }}>
            {ROLE_CATEGORIES.filter(cat => cat.id !== 'orekh').map(cat => {
              const catRoles = cat.roles.filter(r => available.includes(r.id));
              if (catRoles.length === 0) return null;
              return (
                <div key={cat.id} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 6, padding: '8px 10px', border: `1px solid ${BORDER}` }}>
                  <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: EFFORT_COLORS[cat.id] ?? TEXT_DIM, fontFamily: FONT }}>{cat.label}</p>
                  {catRoles.map(role => {
                    const checked = unitRoles.includes(role.id);
                    return (
                      <label key={role.id} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '2px 0', direction: 'rtl', userSelect: 'none' }}>
                        <input type="checkbox" checked={checked} onChange={() => toggleRole(role.id)} style={{ accentColor: ACCENT, cursor: 'pointer', flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: checked ? TEXT : TEXT_DIM, fontFamily: FONT }}>{role.label}</span>
                      </label>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── PermissionsPanel ─────────────────────────────────────────────────────────
export function PermissionsPanel({ mode }: { mode: 'full' | 'minimized' }) {
  const { personas, setPersonas, minimizePanel, closePanel, openPanel } = usePermissions();
  const [selectedUnit, setSelectedUnit] = useState<UnitId>('gdud-7020');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [effortPopover, setEffortPopover] = useState<EffortPopoverState | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  function startEdit(p: TestPersona) {
    setEditingId(p.id); setEditState(toEditState(p)); setAddingNew(false);
  }
  function startAdd() {
    const blank: EditState = { id: newId(), name: '', description: '', unitPermissions: [], defaultUnitId: selectedUnit };
    setEditState(blank); setEditingId(blank.id); setAddingNew(true);
  }
  function saveEdit() {
    if (!editState) return;
    const updated = fromEditState(editState);
    setPersonas(addingNew ? [...personas, updated] : personas.map(p => p.id === updated.id ? updated : p));
    setEditingId(null); setEditState(null); setAddingNew(false);
  }
  function cancelEdit() { setEditingId(null); setEditState(null); setAddingNew(false); }
  function deletePersona(id: string) {
    setPersonas(personas.filter(p => p.id !== id)); setConfirmDelete(null);
    if (editingId === id) cancelEdit();
  }

  const filtered = personas.filter(p => search === '' || p.name.includes(search) || p.description.includes(search));

  // ─── Minimized ───────────────────────────────────────────────────────────
  if (mode === 'minimized') {
    return (
      <div onClick={openPanel} style={{
        position: 'absolute', bottom: 80, left: 12, zIndex: 500,
        background: 'rgba(13,15,20,0.95)', border: `1px solid ${BORDER}`,
        borderRadius: 8, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 10,
        fontFamily: FONT, boxShadow: '0 4px 20px rgba(0,0,0,0.5)', cursor: 'pointer', direction: 'rtl',
      }}>
        <span style={{ fontSize: 13, color: TEXT, fontWeight: 600 }}>ניהול הרשאות</span>
        <span style={{ fontSize: 11, color: TEXT_DIM }}>↗ הרחב</span>
      </div>
    );
  }

  // ─── Full ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: 'absolute', top: HEADER_H, left: 0, right: MAIN_MENU_W, bottom: 0,
      zIndex: 400, background: BG, display: 'flex', flexDirection: 'column',
      fontFamily: FONT, direction: 'rtl', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 48, borderBottom: `1px solid ${BORDER}`, flexShrink: 0, background: 'rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>ניהול הרשאות</span>
          <span style={{ fontSize: 12, color: TEXT_DIM }}>{personas.length} משתמשים</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn secondary onClick={minimizePanel}>↙ מזעור</Btn>
          <Btn secondary onClick={closePanel}>✕ סגור</Btn>
        </div>
      </div>

      {/* Unit tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, borderBottom: `1px solid ${BORDER}`, flexShrink: 0, padding: '0 12px', background: 'rgba(0,0,0,0.15)' }}>
        {UNITS.map(unit => {
          const isActive = selectedUnit === unit.id;
          return (
            <button key={unit.id} type="button" onClick={() => setSelectedUnit(unit.id)} style={{
              padding: '10px 16px', border: 'none', borderBottom: isActive ? `2px solid ${ACCENT}` : '2px solid transparent',
              background: 'transparent', color: isActive ? ACCENT : TEXT_DIM, fontSize: 13, fontFamily: FONT,
              fontWeight: isActive ? 700 : 400, cursor: 'pointer', transition: 'all 0.12s', whiteSpace: 'nowrap',
            }}>
              {unit.name}
            </button>
          );
        })}
        <span style={{ marginRight: 8, fontSize: 11, color: TEXT_DIM }}>
          — {getUnit(selectedUnit).level === 'gdud' ? 'דרג גדוד' : getUnit(selectedUnit).level === 'hativa' ? 'דרג חטיבה' : 'דרג אוגדה'}
        </span>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <Btn onClick={startAdd}>+ הוסף משתמש</Btn>
        <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש…"
          style={{ padding: '5px 10px', background: 'rgba(0,0,0,0.3)', border: `1px solid ${BORDER}`, borderRadius: 5, color: TEXT, fontSize: 13, fontFamily: FONT, width: 200, direction: 'rtl', outline: 'none' }} />
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Header row */}
        <div style={{ display: 'grid', gridTemplateColumns: '160px 160px 1fr 130px', padding: '8px 20px', borderBottom: `1px solid ${BORDER}`, background: 'rgba(0,0,0,0.2)', position: 'sticky', top: 0, zIndex: 1 }}>
          {['שם', 'תיאור / תפקיד', `תפקידים ב${UNITS.find(u => u.id === selectedUnit)?.name}`, 'פעולות'].map(h => (
            <span key={h} style={{ fontSize: 12, fontWeight: 700, color: TEXT, fontFamily: FONT }}>{h}</span>
          ))}
        </div>

        {/* Rows */}
        {filtered.map(p => {
          const isEditing = editingId === p.id;
          const unitPerm = p.unitPermissions.find(up => up.unitId === selectedUnit);
          const hasAccess = !!unitPerm;
          const unitRoles = unitPerm?.allowedRoleIds.filter(id => id !== 'guest') ?? [];
          const effortIds = [...new Set(unitRoles.map(id => getRoleCategory(id)).filter(Boolean) as RoleCategory[])];

          return (
            <div key={p.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div
                style={{ display: 'grid', gridTemplateColumns: '160px 160px 1fr 130px', padding: '10px 20px', alignItems: 'center', background: isEditing ? ACTIVE_BG : 'transparent', opacity: !hasAccess && !isEditing ? 0.5 : 1, transition: 'background 0.1s' }}
                onMouseEnter={e => { if (!isEditing) (e.currentTarget as HTMLElement).style.background = ROW_HOVER; }}
                onMouseLeave={e => { if (!isEditing) (e.currentTarget as HTMLElement).style.background = isEditing ? ACTIVE_BG : 'transparent'; }}
              >
                <span style={{ fontSize: 14, fontWeight: 600, color: TEXT, fontFamily: FONT }}>{p.name}</span>
                <span style={{ fontSize: 13, color: TEXT_DIM, fontFamily: FONT }}>{p.description}</span>

                {/* תפקידים ביחידה */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
                  {!hasAccess && (
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: FONT }}>אין גישה ליחידה זו</span>
                  )}
                  {hasAccess && effortIds.length === 0 && (
                    <span style={{ fontSize: 12, color: TEXT_DIM, fontFamily: FONT }}>אורח בלבד</span>
                  )}
                  {hasAccess && effortIds.map(catId => {
                    const cat = ROLE_CATEGORIES.find(c => c.id === catId);
                    const color = EFFORT_COLORS[catId] ?? '#888';
                    const isOpen = effortPopover?.personaId === p.id && effortPopover?.effortId === catId && effortPopover?.unitId === selectedUnit;
                    return (
                      <button key={catId} type="button"
                        style={badgeStyle(color, isOpen)}
                        onClick={e => {
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          setEffortPopover(isOpen ? null : { personaId: p.id, effortId: catId, unitId: selectedUnit, rect });
                        }}>
                        {cat?.label ?? catId}
                      </button>
                    );
                  })}
                </div>

                {/* פעולות */}
                <div style={{ display: 'flex', gap: 6 }}>
                  {isEditing ? (
                    <><Btn small onClick={saveEdit}>שמור</Btn><Btn small secondary onClick={cancelEdit}>ביטול</Btn></>
                  ) : (
                    <>
                      <Btn small secondary onClick={() => startEdit(p)}>✏️</Btn>
                      {confirmDelete === p.id ? (
                        <><Btn small danger onClick={() => deletePersona(p.id)}>אשר</Btn><Btn small secondary onClick={() => setConfirmDelete(null)}>לא</Btn></>
                      ) : (
                        <Btn small danger onClick={() => setConfirmDelete(p.id)}>🗑</Btn>
                      )}
                    </>
                  )}
                </div>
              </div>

              {isEditing && editState && (
                <RoleEditor edit={editState} selectedUnit={selectedUnit} onChange={setEditState} />
              )}
            </div>
          );
        })}

        {/* New user row */}
        {addingNew && editState && editingId === editState.id && (
          <div style={{ borderBottom: `1px solid ${BORDER}`, background: ACTIVE_BG }}>
            <div style={{ display: 'grid', gridTemplateColumns: '160px 160px 1fr 130px', padding: '10px 20px', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: ACCENT, fontFamily: FONT, fontWeight: 600 }}>משתמש חדש</span>
              <span /><span />
              <div style={{ display: 'flex', gap: 6 }}>
                <Btn small onClick={saveEdit}>שמור</Btn>
                <Btn small secondary onClick={cancelEdit}>ביטול</Btn>
              </div>
            </div>
            <RoleEditor edit={editState} selectedUnit={selectedUnit} onChange={setEditState} />
          </div>
        )}

        {filtered.length === 0 && !addingNew && (
          <div style={{ padding: 40, textAlign: 'center', color: TEXT_DIM, fontFamily: FONT, fontSize: 14 }}>אין תוצאות</div>
        )}
      </div>

      {/* Effort popover */}
      {effortPopover && (() => {
        const persona = personas.find(p => p.id === effortPopover.personaId);
        return persona ? <EffortRolesPopover popover={effortPopover} persona={persona} onClose={() => setEffortPopover(null)} /> : null;
      })()}
    </div>
  );
}
