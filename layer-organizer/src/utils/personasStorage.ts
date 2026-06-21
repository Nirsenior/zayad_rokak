import { TEST_PERSONAS } from '../data/catalog/users';
import type { TestPersona, PersonaUnitPermission, UnitId } from '../types/session';
import type { RoleId } from '../types/roles';

const KEY = 'permissions-personas-v2';

/** מיגרציה מ-format ישן (v1 עם allowedRoleIds שטוח) */
function migrateOldPersona(raw: Record<string, unknown>): TestPersona | null {
  try {
    const id = raw.id as string;
    const name = raw.name as string;
    const description = (raw.description as string) ?? '';
    const defaultUnitId = (raw.defaultUnitId as UnitId) ?? 'gdud-7020';

    if (raw.unitPermissions) {
      // כבר בפורמט חדש
      return raw as unknown as TestPersona;
    }

    // פורמט ישן: allowedRoleIds + allowedUnitIds
    const allowedRoleIds = (raw.allowedRoleIds as RoleId[]) ?? ['guest'];
    const allowedUnitIds = (raw.allowedUnitIds as UnitId[]) ?? [defaultUnitId];
    const unitPermissions: PersonaUnitPermission[] = allowedUnitIds.map(uid => ({
      unitId: uid,
      allowedRoleIds,
    }));

    return { id, name, description, unitPermissions, defaultUnitId };
  } catch {
    return null;
  }
}

export function loadPersonas(): TestPersona[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      // נסה מיגרציה מ-v1
      const oldRaw = localStorage.getItem('permissions-personas-v1');
      if (oldRaw) {
        const old = JSON.parse(oldRaw) as Record<string, unknown>[];
        const migrated = old.map(migrateOldPersona).filter(Boolean) as TestPersona[];
        if (migrated.length > 0) return migrated;
      }
      return [...TEST_PERSONAS];
    }
    const parsed = JSON.parse(raw) as TestPersona[];
    return parsed.length > 0 ? parsed : [...TEST_PERSONAS];
  } catch {
    return [...TEST_PERSONAS];
  }
}

export function savePersonas(personas: TestPersona[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(personas));
  } catch {}
}

export function resetPersonas(): void {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem('permissions-personas-v1');
  } catch {}
}
