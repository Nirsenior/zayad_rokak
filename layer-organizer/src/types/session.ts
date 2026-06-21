import { getRoleCategory } from './roles';
import type { RoleCategory, RoleId } from './roles';

/** רמת יחידה ארגונית */
export type UnitLevel = 'gdud' | 'hativa' | 'ugda';

/** יחידות לבחירה בכותרת (3 אופציות) */
export type UnitId = 'gdud-7020' | 'hativa-5' | 'ugda-162';

export interface Unit {
  id: UnitId;
  level: UnitLevel;
  name: string;
  parentId?: string;
}

/** טקסטים ברכיב User בכותרת (Figma "חיפוש סגור") */
export interface TestPersonaHeaderLabels {
  operationTitle: string;
  unitLabel: string;
  cellType: string;
  cellName: string;
}

/** הרשאות לפרסונה ביחידה ספציפית */
export interface PersonaUnitPermission {
  unitId: UnitId;
  /** תפקידים מורשים ביחידה זו; 'guest' תמיד כלול */
  allowedRoleIds: RoleId[];
}

/** פרסונה לניסוי משתמשים */
export interface TestPersona {
  id: string;
  name: string;
  description: string;
  /** הרשאות לפי יחידה — כל יחידה עם סל תפקידים מותאם לדרגה */
  unitPermissions: PersonaUnitPermission[];
  /** יחידה ברירת מחדל */
  defaultUnitId: UnitId;
  /** תצוגה ב-User במרכז הטופ-בר */
  header?: Partial<TestPersonaHeaderLabels>;
}

/** עוזרים לחישוב שדות נגזרים */
export function getPersonaAllowedUnits(persona: TestPersona): UnitId[] {
  return persona.unitPermissions.map(up => up.unitId);
}

export function getPersonaRolesForUnit(persona: TestPersona, unitId: UnitId): RoleId[] {
  return persona.unitPermissions.find(up => up.unitId === unitId)?.allowedRoleIds ?? ['guest'];
}

export function getPersonaEffortCategoriesForUnit(
  persona: TestPersona,
  unitId: UnitId,
): RoleCategory[] {
  const roles = getPersonaRolesForUnit(persona, unitId).filter(id => id !== 'guest');
  const cats = new Set(roles.map(id => getRoleCategory(id)).filter(Boolean) as RoleCategory[]);
  return [...cats];
}

export const DEFAULT_HEADER_LABELS: TestPersonaHeaderLabels = {
  operationTitle: 'חרבות ברזל,',
  unitLabel: 'תוכנית שמש צפונית',
  cellType: 'מציאות מבצעית',
  cellName: 'תא תקיפה',
};

/** מצב סשן מערכת */
export interface AppSession {
  userId: string;
  /** מאמץ שנבחר ב-Mission Plan */
  activeEffort: RoleCategory | null;
  /** תפקיד ייצוגי — נגזר מ-activeEffort + יחידה */
  activeRoleId: RoleId | null;
  /** תפקידים מורשים ביחידה הנוכחית — נגזר מ-unitPermissions[unitId] */
  allowedRoleIds: RoleId[];
  unitId: UnitId;
  studyOption: 1 | 2;
}

/** @deprecated Use TestPersona */
export type AppUser = TestPersona;
