import type { AppSession } from '../../types/session';
import type { RoleCategory, RoleId } from '../../types/roles';
import { getRoleCategory } from '../../types/roles';

/** מזהי רכיבי מעטפת / מערכת */
export type FeatureId =
  | 'mission-plan'
  | 'user-picker'
  | 'unit-picker'
  | 'search-bar'
  | 'main-side-menu'
  | 'layers-panel'
  | 'side-menu-journal'
  | 'side-menu-targets'
  | 'side-menu-events'
  | 'side-menu-observations'
  | 'map-compass'
  | 'map-footer';

export interface FeatureRule {
  /** קטגוריות תפקיד שרואות את הרכיב (ריק = כולם) */
  roleCategories?: RoleCategory[];
  /** תפקידים ספציפיים (עדיפות על קטגוריה) */
  roleIds?: RoleId[];
  /** דורש יחידה שנבחרה */
  requiresUnit?: boolean;
}

const FEATURE_RULES: Partial<Record<FeatureId, FeatureRule>> = {
  'unit-picker': { requiresUnit: false },
  'side-menu-targets': { roleCategories: ['agam', 'modiin', 'esh', 'oref'] },
  'side-menu-journal': { roleCategories: ['agam', 'manhala', 'tikshuv'] },
};

export function isFeatureVisible(featureId: FeatureId, session: AppSession): boolean {
  const rule = FEATURE_RULES[featureId];
  if (!rule) return true;

  if (rule.requiresUnit && !session.unitId) return false;

  const roleId = session.activeRoleId;
  if (!roleId) return !rule.roleCategories && !rule.roleIds;

  if (rule.roleIds?.length) return rule.roleIds.includes(roleId);

  if (rule.roleCategories?.length) {
    const cat = getRoleCategory(roleId);
    return cat !== null && rule.roleCategories.includes(cat);
  }

  return true;
}
