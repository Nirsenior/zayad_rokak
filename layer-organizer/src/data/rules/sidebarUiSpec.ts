import type { RoleCategory } from '../../types/roles';
import type { SidebarCompositeId, SidebarNavItemId } from '../../types/sidebarUi';

/**
 * מפרט סייד-בר — יתעדכן בהמשך.
 *
 * חלק עליון:
 *   1. effortNav — משותף לכל התפקידים באותו מאמץ (תווית = שם המאמץ)
 *   2. קו מפריד + roleNav — ייחודי לתפקיד הפעיל (תווית = שם התפקיד), כמו ניהול מערכת באג"ם
 *
 * קישורים חיצוניים — תחתית מרכז המסך (MapExternalLinksDock), לא בסיידבר
 *
 * חלק תחתון (קבוע):
 *   sharedBottom — כולם רואים, מלמטה למעלה
 */

const NAV_ALL: SidebarNavItemId[] = [
  'shell.sidebar.nav.item.missions',
  'shell.sidebar.nav.item.area',
  'shell.sidebar.nav.item.journal',
  'shell.sidebar.nav.item.guard',
];

const NAV_NO_JOURNAL: SidebarNavItemId[] = [
  'shell.sidebar.nav.item.missions',
  'shell.sidebar.nav.item.area',
  'shell.sidebar.nav.item.guard',
];

/** תחתית — ניווט משותף לכל המאמצים (Figma 393:36731, 392:30648) */
export const SHARED_SIDEBAR_BOTTOM_NAV: SidebarNavItemId[] = [
  'shell.sidebar.nav.item.crewTree',
  'shell.sidebar.nav.item.tahkir',
];

/** אג"ם — משותף לכל תפקידי האגם (Figma 719:27752) */
const NAV_AGAM_EFFORT: SidebarNavItemId[] = [
  'shell.sidebar.nav.item.battlePicture',
  'shell.sidebar.nav.item.effortSync',
  'shell.sidebar.nav.item.tamach',
];

/** קומפוננטות מאמץ לפי קטגוריה */
export const EFFORT_SIDEBAR_NAV: Record<RoleCategory, SidebarNavItemId[]> = {
  orekh: NAV_ALL,
  agam: NAV_AGAM_EFFORT,
  oref: NAV_ALL,
  modiin: NAV_NO_JOURNAL,
  esh: NAV_ALL,
  /** מוחלף ב-resolveSidebarUi — רשימה לפי תפקיד */
  tikshuv: [],
  manhala: NAV_ALL,
};

/** פריטי תפקיד שמוצגים תמיד עבור כל מאמץ (גם אם נעולים) — מתחת לקו */
export const EFFORT_ROLE_NAV_ALL: Partial<Record<RoleCategory, SidebarNavItemId[]>> = {
  agam: ['shell.sidebar.nav.item.planManagement', 'shell.sidebar.nav.item.permissions'],
  // tikshuv מטופל ב-tikshuvSidebar.ts
};

/** תחתית — משותף לכל המאמצים והתפקידים (מלמטה למעלה: AI תחתון) */
export const SHARED_SIDEBAR_BOTTOM: SidebarCompositeId[] = [
  'shell.sidebar.pkmb',
  'shell.sidebar.ai',
];
