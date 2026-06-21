import { ROLE_CATEGORIES, getRoleLabel } from '../types/roles';
import type { RoleCategory, RoleId } from '../types/roles';
import type { UnitLevel } from '../types/session';
import { isTikshuvRole, isRoleAllowedAtUnit } from '../data/rules/tikshuvRoleAccess';
import {
  DEFAULT_NAV_ACTIVE,
  EFFORT_NAV_ACTIVE,
  SIDEBAR_NAV_REGISTRY,
} from '../data/rules/sidebarMenuRegistry';
import {
  EFFORT_SIDEBAR_NAV,
  EFFORT_ROLE_NAV_ALL,
  SHARED_SIDEBAR_BOTTOM,
  SHARED_SIDEBAR_BOTTOM_NAV,
} from '../data/rules/sidebarUiSpec';
import {
  TIKSHUV_DEFAULT_ACTIVE,
  resolveTikshuvEffortNav,
  resolveTikshuvAllRoleNav,
} from '../data/rules/tikshuvSidebar';
import type {
  ResolvedSidebarUi,
  SidebarNavItemId,
  SidebarNavItemResolved,
} from '../types/sidebarUi';

function getEffortLabel(category: RoleCategory): string {
  return ROLE_CATEGORIES.find(c => c.id === category)?.label ?? category;
}

/** תפקיד ייצוגי ראשון שהמשתמש מורשה לו בתוך מאמץ (לשכבות / הרשאות עריכה) */
export function getRepresentativeRole(
  effort: RoleCategory | null,
  allowedRoleIds: RoleId[],
): RoleId | null {
  if (!effort) return null;
  const cat = ROLE_CATEGORIES.find(c => c.id === effort);
  if (!cat) return null;
  return cat.roles.find(r => allowedRoleIds.includes(r.id))?.id ?? null;
}

function resolveNavItems(
  ids: SidebarNavItemId[],
  allowedRoleIds: RoleId[],
  activeId: SidebarNavItemId | null,
  unitLevel: UnitLevel,
): SidebarNavItemResolved[] {
  return ids
    .filter(id => {
      const requiredRoleId = SIDEBAR_NAV_REGISTRY[id].requiredRoleId;
      // תפקידים שלא זמינים בדרג הנוכחי — מוסתרים לחלוטין (לא נעולים)
      if (requiredRoleId && isTikshuvRole(requiredRoleId) && !isRoleAllowedAtUnit(requiredRoleId, unitLevel)) {
        return false;
      }
      return true;
    })
    .map(id => {
      const def = SIDEBAR_NAV_REGISTRY[id];
      const requiredRoleId = def.requiredRoleId;
      const locked = !!requiredRoleId && !allowedRoleIds.includes(requiredRoleId);
      return {
        ...def,
        active: !locked && activeId !== null && id === activeId,
        locked,
        requiredRoleLabel: requiredRoleId ? getRoleLabel(requiredRoleId) : undefined,
      };
    });
}

export function resolveSidebarUi(
  activeEffort: RoleCategory | null,
  allowedRoleIds: RoleId[],
  unitLevel: UnitLevel = 'ugda',
  activeNavId: SidebarNavItemId | null = null,
): ResolvedSidebarUi {
  const effort: RoleCategory = activeEffort ?? 'orekh';
  const repRoleId = getRepresentativeRole(effort, allowedRoleIds) ?? 'guest';

  const isTikshuv = effort === 'tikshuv';
  const effortIds = isTikshuv
    ? resolveTikshuvEffortNav()
    : (EFFORT_SIDEBAR_NAV[effort] ?? EFFORT_SIDEBAR_NAV.orekh);
  const roleIds = isTikshuv
    ? resolveTikshuvAllRoleNav()
    : (EFFORT_ROLE_NAV_ALL[effort] ?? []);

  const defaultActiveId = isTikshuv
    ? TIKSHUV_DEFAULT_ACTIVE
    : (EFFORT_NAV_ACTIVE[effort] ?? DEFAULT_NAV_ACTIVE);
  const allTopIds = [...effortIds, ...roleIds];
  const globalActiveId =
    activeNavId && allTopIds.includes(activeNavId) ? activeNavId : defaultActiveId;
  const effortActiveId = effortIds.includes(globalActiveId) ? globalActiveId : null;
  const roleActiveId = roleIds.includes(globalActiveId) ? globalActiveId : null;

  return {
    roleId: repRoleId,
    effortCategory: effort,
    effortLabel: getEffortLabel(effort),
    roleLabel: 'ייחודי לתפקיד',
    effortNavItems: resolveNavItems(effortIds, allowedRoleIds, effortActiveId, unitLevel),
    roleNavItems: resolveNavItems(roleIds, allowedRoleIds, roleActiveId, unitLevel),
    sharedBottomNav: resolveNavItems([...SHARED_SIDEBAR_BOTTOM_NAV], allowedRoleIds, null, unitLevel),
    sharedBottom: [...SHARED_SIDEBAR_BOTTOM],
  };
}
