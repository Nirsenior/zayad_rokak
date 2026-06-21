import { getUnit } from '../data/catalog/units';
import type { TestPersona, UnitId } from '../types/session';
import { getPersonaRolesForUnit } from '../types/session';
import type { RoleId } from '../types/roles';
import { loadPersonas } from './personasStorage';
import { getMissionPlanMenu } from './missionPlanRoles';

/** תפקיד פעיל תקף ליחידה + הרשאות פרסונה */
export function coerceActiveRoleForUnit(
  persona: TestPersona,
  unitId: UnitId,
  preferred: RoleId | null,
): RoleId {
  const unitLevel = getUnit(unitId).level;
  const allowedRoleIds = getPersonaRolesForUnit(persona, unitId);
  const allowedIds = getMissionPlanMenu({ allowedRoleIds }, unitLevel)
    .flatMap(cat => cat.roles)
    .filter(r => r.state === 'allowed')
    .map(r => r.id);

  if (preferred && allowedIds.includes(preferred)) return preferred;
  const defaultRole = allowedRoleIds.find(id => id !== 'guest') ?? 'guest';
  if (allowedIds.includes(defaultRole as RoleId)) return defaultRole as RoleId;
  return allowedIds[0] ?? 'guest';
}

export function getPersona(userId: string): TestPersona {
  const personas = loadPersonas();
  return personas.find(p => p.id === userId) ?? personas[0];
}
