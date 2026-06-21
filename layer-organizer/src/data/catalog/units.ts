import type { Unit, UnitId } from '../../types/session';

export const UNITS: Unit[] = [
  { id: 'gdud-7020', level: 'gdud', name: "גדוד 7020" },
  { id: 'hativa-5', level: 'hativa', name: 'חטיבה 5' },
  { id: 'ugda-162', level: 'ugda', name: 'אוגדה 162' },
];

export const DEFAULT_UNIT_ID: UnitId = 'gdud-7020';

/** כל היחידות — למשתמש עם הרשאה מלאה */
export const ALL_UNIT_IDS: UnitId[] = UNITS.map(u => u.id);

const UNIT_IDS = new Set(UNITS.map(u => u.id));

export function personaAllowsUnit(allowedUnitIds: UnitId[], unitId: UnitId): boolean {
  return allowedUnitIds.includes(unitId);
}

export function getUnitsForPersona(allowedUnitIds: UnitId[]): Unit[] {
  return UNITS.filter(u => allowedUnitIds.includes(u.id));
}

export function resolvePersonaUnitId(
  allowedUnitIds: UnitId[],
  defaultUnitId: UnitId,
  persisted: UnitId | undefined,
): UnitId {
  if (persisted && personaAllowsUnit(allowedUnitIds, persisted)) return persisted;
  if (personaAllowsUnit(allowedUnitIds, defaultUnitId)) return defaultUnitId;
  return allowedUnitIds[0] ?? DEFAULT_UNIT_ID;
}

export function isUnitId(id: string): id is UnitId {
  return UNIT_IDS.has(id as UnitId);
}

export function getUnit(id: UnitId): Unit {
  return UNITS.find(u => u.id === id) ?? UNITS[0];
}

export function getUnitLabel(id: UnitId): string {
  return getUnit(id).name;
}
