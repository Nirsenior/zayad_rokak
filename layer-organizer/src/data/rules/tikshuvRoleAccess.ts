import type { RoleId } from '../../types/roles';
import type { UnitLevel } from '../../types/session';

/** תפקידי מאמץ תקשוב */
export const TIKSHUV_ROLE_IDS: RoleId[] = [
  'tikshuv-rashi',
  'spektrum',
  'ta-shlita',
  'ta-radio',
  'retzifut-tipul',
  'hafala',
  'moked-nitur',
  'ta-tikhnun',
  'shuv',
];

/** דרגי יחידה שבהם תפקיד זמין ב-Mission Plan (לא מוצג בכלל בדרגים אחרים) */
export const TIKSHUV_ROLE_UNIT_LEVELS: Partial<Record<RoleId, UnitLevel[]>> = {
  'tikshuv-rashi': ['gdud', 'hativa', 'ugda'],
  spektrum: ['hativa', 'ugda'],
  'ta-shlita': ['ugda'],
  'ta-radio': ['ugda'],
  'retzifut-tipul': ['ugda'],
  hafala: ['ugda'],
  'moked-nitur': ['ugda'],
  'ta-tikhnun': ['ugda'],
  shuv: ['ugda'],
};

export function isTikshuvRole(roleId: RoleId): boolean {
  return TIKSHUV_ROLE_IDS.includes(roleId);
}

export function isRoleAllowedAtUnit(roleId: RoleId, unitLevel: UnitLevel): boolean {
  const levels = TIKSHUV_ROLE_UNIT_LEVELS[roleId];
  if (!levels) return true;
  return levels.includes(unitLevel);
}
