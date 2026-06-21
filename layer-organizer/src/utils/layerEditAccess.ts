import { TEST_PERSONAS } from '../data/catalog/users';
import { EDIT_PERMISSIONS } from '../data/rules/editPermissions';
import type { RoleCategory, RoleId } from '../types/roles';
import { getRoleCategory } from '../types/roles';

/** תפקיד לבדיקת הרשאות — לא משאיר null אם לפרסונה יש ברירת מחדל */
export function resolveEffectiveRoleId(
  activeRoleId: RoleId | null,
  userId: string,
): RoleId | null {
  if (activeRoleId) return activeRoleId;
  const persona = TEST_PERSONAS.find(p => p.id === userId) ?? TEST_PERSONAS[0];
  const firstRole = persona.unitPermissions[0]?.allowedRoleIds.find(id => id !== 'guest');
  return (firstRole as RoleId | undefined) ?? null;
}

export function canRoleEditLayer(layerId: string, roleId: RoleId | null, userId: string): boolean {
  const categories = EDIT_PERMISSIONS[layerId];
  if (!categories?.length) return false;
  const effective = resolveEffectiveRoleId(roleId, userId);
  if (!effective) return false;
  const category = getRoleCategory(effective);
  if (!category) return false;
  return categories.includes(category as RoleCategory);
}
