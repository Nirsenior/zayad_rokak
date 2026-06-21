import { isRoleAllowedAtUnit, isTikshuvRole } from '../data/rules/tikshuvRoleAccess';
import { getRoleCategory } from '../types/roles';
import type { UnitLevel } from '../types/session';
import type { RoleCategory, RoleId } from '../types/roles';
import { ROLE_CATEGORIES } from '../types/roles';

/** מצב מאמץ ב-Mission Plan */
export type EffortState = 'allowed' | 'locked';
export type MissionPlanRoleState = 'allowed' | 'locked' | 'hidden';
export const GUEST_ROLE_ID: RoleId = 'guest';

export interface EffortRoleInfo {
  id: RoleId;
  label: string;
  allowed: boolean;
}

export interface EffortMenuItem {
  id: RoleCategory;
  label: string;
  state: EffortState;
  roles: EffortRoleInfo[];
}

export function personaAllowsRole(allowedRoleIds: RoleId[], roleId: RoleId): boolean {
  if (roleId === GUEST_ROLE_ID) return true;
  return allowedRoleIds.includes(roleId);
}

/** מאמצים שהמשתמש "שייך" אליהם — מחושב מהתפקידים שיש לו */
function deriveEffortCategories(allowedRoleIds: RoleId[]): RoleCategory[] {
  const cats = new Set<RoleCategory>();
  for (const id of allowedRoleIds) {
    if (id === 'guest') continue;
    const cat = getRoleCategory(id);
    if (cat) cats.add(cat);
  }
  return [...cats];
}

export function getMissionPlanRoleState(
  persona: { allowedRoleIds: RoleId[]; effortCategories?: RoleCategory[] },
  roleId: RoleId,
  categoryId: RoleCategory,
  unitLevel: UnitLevel,
): MissionPlanRoleState {
  if (roleId === GUEST_ROLE_ID) return 'allowed';
  if (isTikshuvRole(roleId) && !isRoleAllowedAtUnit(roleId, unitLevel)) return 'hidden';
  if (personaAllowsRole(persona.allowedRoleIds, roleId)) return 'allowed';
  // "נעול" — המשתמש שייך למאמץ אבל לא לתפקיד הספציפי
  const effortCats = persona.effortCategories ?? deriveEffortCategories(persona.allowedRoleIds);
  if (effortCats.includes(categoryId)) return 'locked';
  return 'hidden';
}

export function getMissionPlanEffortMenu(
  persona: { allowedRoleIds: RoleId[]; effortCategories?: RoleCategory[] },
  unitLevel: UnitLevel,
): EffortMenuItem[] {
  return ROLE_CATEGORIES.map(cat => {
    const roles: EffortRoleInfo[] = cat.roles
      .filter(role => getMissionPlanRoleState(persona, role.id, cat.id, unitLevel) !== 'hidden')
      .map(role => ({
        id: role.id,
        label: role.label,
        allowed: getMissionPlanRoleState(persona, role.id, cat.id, unitLevel) === 'allowed',
      }));
    const hasAny = roles.some(r => r.allowed);
    return { id: cat.id, label: cat.label, state: hasAny ? 'allowed' : 'locked', roles } satisfies EffortMenuItem;
  });
}

/** @deprecated — use getMissionPlanEffortMenu */
export function getMissionPlanMenu(
  persona: { allowedRoleIds: RoleId[]; effortCategories?: RoleCategory[] },
  unitLevel: UnitLevel,
) {
  return ROLE_CATEGORIES.map(cat => ({
    ...cat,
    roles: cat.roles
      .map(role => ({ ...role, state: getMissionPlanRoleState(persona, role.id, cat.id, unitLevel) }))
      .filter(role => role.state !== 'hidden'),
  })).filter(cat => cat.roles.length > 0);
}
