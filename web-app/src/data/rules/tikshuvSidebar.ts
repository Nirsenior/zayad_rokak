import type { RoleId } from '../../types/roles';
import type { SidebarNavItemId } from '../../types/sidebarUi';

/** משותף לכל תפקידי מאמץ תקשוב — מעל קו המפריד */
const TIKSHUV_EFFORT_NAV: SidebarNavItemId[] = [
  'shell.sidebar.nav.item.ict.dashboard',
  'shell.sidebar.nav.item.ict.planning',
  'shell.sidebar.nav.item.ict.effortSync',
  'shell.sidebar.nav.item.ict.radio',
  'shell.sidebar.nav.item.ict.spectrum',
  'shell.sidebar.nav.item.ict.monitor',
  'shell.sidebar.nav.item.ict.crewSupport',
];

/** ייחודי לתפקיד — מתחת לקו המפריד */
const TIKSHUV_ROLE_NAV: Partial<Record<RoleId, SidebarNavItemId[]>> = {
  shuv: ['shell.sidebar.nav.item.ict.lomer'],
  'retzifut-tipul': ['shell.sidebar.nav.item.ict.manhala'],
};

export function resolveTikshuvEffortNav(): SidebarNavItemId[] {
  return [...TIKSHUV_EFFORT_NAV];
}

export function resolveTikshuvRoleNav(roleId: RoleId): SidebarNavItemId[] {
  return TIKSHUV_ROLE_NAV[roleId] ?? [];
}

/** כל פריטי התפקיד של תקשוב — תמיד מוצגים (חלקם נעולים לפי הרשאה) */
export function resolveTikshuvAllRoleNav(): SidebarNavItemId[] {
  return [
    'shell.sidebar.nav.item.ict.lomer',
    'shell.sidebar.nav.item.ict.manhala',
  ];
}

export const TIKSHUV_DEFAULT_ACTIVE: SidebarNavItemId =
  'shell.sidebar.nav.item.ict.dashboard';
