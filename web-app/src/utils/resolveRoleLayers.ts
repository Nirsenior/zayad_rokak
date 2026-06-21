import type { RoleId } from '../types/roles';
import { getRoleCategory } from '../types/roles';
import { ROLE_DEFAULT_LAYERS, ROLE_DEFAULT_LAYERS_BY_ROLE } from '../data/rules/roleDefaults';
export { personaAllowsRole } from './missionPlanRoles';

/** מזהי שכבות שצריכות להיות בסדרן לפי תפקיד פעיל */
export function resolveRoleLayerIds(roleId: RoleId | null): Set<string> {
  if (!roleId) return new Set();

  const byRole = ROLE_DEFAULT_LAYERS_BY_ROLE[roleId];
  if (byRole?.length) return new Set(byRole);

  const category = getRoleCategory(roleId);
  if (!category) return new Set();

  return new Set(ROLE_DEFAULT_LAYERS[category] ?? []);
}

export function getDefaultRoleForPersona(
  personaId: string,
  personas: { id: string; defaultRoleId: RoleId }[],
): RoleId | null {
  return personas.find(p => p.id === personaId)?.defaultRoleId ?? null;
}
