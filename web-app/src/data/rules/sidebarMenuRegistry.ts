import { figmaAssets } from '../../assets/figmaAssets';
import { TIKSHUV_NAV_ICON } from './tikshuvNavIcons';
import type { RoleCategory } from '../../types/roles';
import type { SidebarNavItemDef, SidebarNavItemId } from '../../types/sidebarUi';

function ictIcon(id: SidebarNavItemId): string {
  return TIKSHUV_NAV_ICON[id] ?? figmaAssets.ictNavDashboard;
}

/** הגדרות כפתורי ניווט — מקור אחד ל-Figma / תוויות */
export const SIDEBAR_NAV_REGISTRY: Record<SidebarNavItemId, SidebarNavItemDef> = {
  'shell.sidebar.nav.item.missions': {
    kind: 'nav',
    id: 'shell.sidebar.nav.item.missions',
    label: 'משימות',
    icon: figmaAssets.sideMenuMissionIcon,
    iconRotate: -45,
    variant: 'attack',
  },
  'shell.sidebar.nav.item.area': {
    kind: 'nav',
    id: 'shell.sidebar.nav.item.area',
    label: 'א.שטח',
    icon: figmaAssets.sideMenuAreaIcon,
    variant: 'attack',
  },
  'shell.sidebar.nav.item.journal': {
    kind: 'nav',
    id: 'shell.sidebar.nav.item.journal',
    label: 'יומן',
    icon: figmaAssets.sideMenuJournalIcon,
    variant: 'attack',
  },
  'shell.sidebar.nav.item.guard': {
    kind: 'nav',
    id: 'shell.sidebar.nav.item.guard',
    label: 'משמרת',
    icon: figmaAssets.sideMenuGuardIcon,
    variant: 'attack',
  },
  'shell.sidebar.nav.item.crewTree': {
    kind: 'nav',
    id: 'shell.sidebar.nav.item.crewTree',
    label: 'עץ ציוות',
    icon: figmaAssets.sideMenuCrewTreeIcon,
    variant: 'attack',
    devResponsibility: 'אחריות פיתוח שירות - אלביט\nאחריות פיתוח ממשק - אגם',
  },
  'shell.sidebar.nav.item.tahkir': {
    kind: 'nav',
    id: 'shell.sidebar.nav.item.tahkir',
    label: 'תחקור',
    icon: figmaAssets.sideMenuTahkirIcon,
    variant: 'ecosystem',
    devResponsibility: 'אחריות פיתוח - מדור תחקור (בינה ולאסו)',
  },
  'shell.sidebar.nav.item.battlePicture': {
    kind: 'nav',
    id: 'shell.sidebar.nav.item.battlePicture',
    label: 'ת. קרב',
    icon: figmaAssets.agamBattlePictureIcon,
    variant: 'ecosystem',
  },
  'shell.sidebar.nav.item.effortSync': {
    kind: 'nav',
    id: 'shell.sidebar.nav.item.effortSync',
    label: 'סנכרון מאמצים',
    labelLines: ['סנכרון', 'מאמצים'],
    icon: figmaAssets.agamEffortSyncIcon,
    variant: 'ecosystem',
  },
  'shell.sidebar.nav.item.tamach': {
    kind: 'nav',
    id: 'shell.sidebar.nav.item.tamach',
    label: 'תמ"כ',
    icon: figmaAssets.agamTamachIcon,
    variant: 'ecosystem',
  },
  'shell.sidebar.nav.item.planManagement': {
    kind: 'nav',
    id: 'shell.sidebar.nav.item.planManagement',
    label: 'ניהול תוכנית',
    labelLines: ['ניהול', 'תוכנית'],
    icon: figmaAssets.agamPlanManagementIcon,
    variant: 'ecosystem',
    requiredRoleId: 'nihul-maarechet',
  },
  'shell.sidebar.nav.item.permissions': {
    kind: 'nav',
    id: 'shell.sidebar.nav.item.permissions',
    label: 'ניהול הרשאות',
    labelLines: ['ניהול', 'הרשאות'],
    icon: figmaAssets.agamPermissionsIcon,
    variant: 'ecosystem',
    requiredRoleId: 'nihul-maarechet',
  },
  'shell.sidebar.nav.item.ict.dashboard': {
    kind: 'nav',
    id: 'shell.sidebar.nav.item.ict.dashboard',
    label: 'דשבורד ראשי',
    labelLines: ['דשבורד', 'ראשי'],
    icon: ictIcon('shell.sidebar.nav.item.ict.dashboard'),
    variant: 'ecosystem',
  },
  'shell.sidebar.nav.item.ict.planning': {
    kind: 'nav',
    id: 'shell.sidebar.nav.item.ict.planning',
    label: 'תכנון',
    icon: ictIcon('shell.sidebar.nav.item.ict.planning'),
    variant: 'ecosystem',
  },
  'shell.sidebar.nav.item.ict.effortSync': {
    kind: 'nav',
    id: 'shell.sidebar.nav.item.ict.effortSync',
    label: 'סנכרון וניהול התקשוב',
    labelLines: ['סנכרון וניהול', 'התקשוב'],
    icon: ictIcon('shell.sidebar.nav.item.ict.effortSync'),
    variant: 'ecosystem',
  },
  'shell.sidebar.nav.item.ict.radio': {
    kind: 'nav',
    id: 'shell.sidebar.nav.item.ict.radio',
    label: 'רדיו',
    icon: ictIcon('shell.sidebar.nav.item.ict.radio'),
    variant: 'ecosystem',
  },
  'shell.sidebar.nav.item.ict.spectrum': {
    kind: 'nav',
    id: 'shell.sidebar.nav.item.ict.spectrum',
    label: 'ספקטרום',
    icon: ictIcon('shell.sidebar.nav.item.ict.spectrum'),
    variant: 'ecosystem',
  },
  'shell.sidebar.nav.item.ict.monitor': {
    kind: 'nav',
    id: 'shell.sidebar.nav.item.ict.monitor',
    label: 'ניטור',
    icon: ictIcon('shell.sidebar.nav.item.ict.monitor'),
    variant: 'ecosystem',
  },
  'shell.sidebar.nav.item.ict.lomer': {
    kind: 'nav',
    id: 'shell.sidebar.nav.item.ict.lomer',
    label: 'לומ"ר',
    icon: ictIcon('shell.sidebar.nav.item.ict.lomer'),
    variant: 'ecosystem',
    requiredRoleId: 'shuv',
  },
  'shell.sidebar.nav.item.ict.manhala': {
    kind: 'nav',
    id: 'shell.sidebar.nav.item.ict.manhala',
    label: 'מנהלה',
    icon: ictIcon('shell.sidebar.nav.item.ict.manhala'),
    variant: 'ecosystem',
    requiredRoleId: 'retzifut-tipul',
  },
  'shell.sidebar.nav.item.ict.crewSupport': {
    kind: 'nav',
    id: 'shell.sidebar.nav.item.ict.crewSupport',
    label: 'ציוות ותמ"כ',
    labelLines: ['ציוות', 'ותמ"כ'],
    icon: ictIcon('shell.sidebar.nav.item.ict.crewSupport'),
    variant: 'ecosystem',
  },
};

export const DEFAULT_NAV_ACTIVE: SidebarNavItemId = 'shell.sidebar.nav.item.missions';

/** כפתור מסומן בברירת מחדל לפי מאמץ */
export const EFFORT_NAV_ACTIVE: Partial<Record<RoleCategory, SidebarNavItemId>> = {
  agam: 'shell.sidebar.nav.item.battlePicture',
  tikshuv: 'shell.sidebar.nav.item.ict.dashboard',
};
