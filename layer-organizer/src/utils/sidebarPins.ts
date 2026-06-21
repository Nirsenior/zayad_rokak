import type { SidebarNavItemId } from '../types/sidebarUi';
import type { RoleCategory } from '../types/roles';

const KEY = (userId: string, effort: RoleCategory | null) =>
  `sidebar-pins-v1-${userId}-${effort ?? 'none'}`;

/** טוען מזהי פריטים מוצמדים (מוצגים). null = אין שמירה — השתמש בברירות מחדל */
export function loadPinnedIds(
  userId: string,
  effort: RoleCategory | null,
): Set<SidebarNavItemId> | null {
  try {
    const raw = localStorage.getItem(KEY(userId, effort));
    if (!raw) return null;
    return new Set(JSON.parse(raw) as SidebarNavItemId[]);
  } catch {
    return null;
  }
}

export function savePinnedIds(
  userId: string,
  effort: RoleCategory | null,
  pinned: Set<SidebarNavItemId>,
): void {
  try {
    localStorage.setItem(KEY(userId, effort), JSON.stringify([...pinned]));
  } catch {}
}

/** ברירת מחדל: פריטים ללא הרשאה (locked) — מוסתרים; שאר הפריטים — מוצגים */
export function getDefaultPinnedIds(
  items: { id: SidebarNavItemId; locked: boolean }[],
): Set<SidebarNavItemId> {
  return new Set(items.filter(i => !i.locked).map(i => i.id));
}
