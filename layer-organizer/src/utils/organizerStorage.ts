import type { PersistedOrganizer } from './buildOrganizerState';

const LEGACY_KEY_V2 = (userId: string) => `layer-organizer-v2-${userId}`;

/** העדפות סדרן — פר משתמש + יחידה (לא לפי תפקיד) */
export const ORGANIZER_STORAGE_KEY = (userId: string, unitId: string) =>
  `layer-organizer-v3-${userId}--${unitId}`;

export function loadOrganizer(userId: string, unitId: string): PersistedOrganizer | null {
  try {
    const key = ORGANIZER_STORAGE_KEY(userId, unitId);
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as PersistedOrganizer;

    const legacy = localStorage.getItem(LEGACY_KEY_V2(userId));
    if (legacy) {
      localStorage.setItem(key, legacy);
      return JSON.parse(legacy) as PersistedOrganizer;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function saveOrganizer(
  userId: string,
  unitId: string,
  persisted: PersistedOrganizer,
): void {
  try {
    localStorage.setItem(ORGANIZER_STORAGE_KEY(userId, unitId), JSON.stringify(persisted));
  } catch {
    /* ignore */
  }
}
