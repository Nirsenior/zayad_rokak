import type { RoleCategory, RoleId } from './roles';

/** מזהי קומפוננטות סייד-בר — יציבים, תואמים ל-ROLE_DESIGN_SYSTEM §3 */
export type SidebarNavItemId =
  | 'shell.sidebar.nav.item.missions'
  | 'shell.sidebar.nav.item.area'
  | 'shell.sidebar.nav.item.journal'
  | 'shell.sidebar.nav.item.guard'
  | 'shell.sidebar.nav.item.crewTree'
  | 'shell.sidebar.nav.item.tahkir'
  /** אג"ם — Figma 719:27752 */
  | 'shell.sidebar.nav.item.battlePicture'
  | 'shell.sidebar.nav.item.effortSync'
  | 'shell.sidebar.nav.item.tamach'
  | 'shell.sidebar.nav.item.planManagement'
  | 'shell.sidebar.nav.item.permissions'
  /** תקשוב — PRD + Figma עזרי שליטה */
  | 'shell.sidebar.nav.item.ict.dashboard'
  | 'shell.sidebar.nav.item.ict.planning'
  | 'shell.sidebar.nav.item.ict.effortSync'
  | 'shell.sidebar.nav.item.ict.radio'
  | 'shell.sidebar.nav.item.ict.spectrum'
  | 'shell.sidebar.nav.item.ict.monitor'
  | 'shell.sidebar.nav.item.ict.lomer'
  | 'shell.sidebar.nav.item.ict.manhala'
  | 'shell.sidebar.nav.item.ict.crewSupport';

export type SidebarNavVariant = 'attack' | 'ecosystem';

export type SidebarCompositeId =
  | 'shell.sidebar.docStrip'
  | 'shell.sidebar.pkmb'
  | 'shell.sidebar.ai';

export type SidebarComponentId = SidebarNavItemId | SidebarCompositeId;

export interface SidebarNavItemDef {
  kind: 'nav';
  id: SidebarNavItemId;
  label: string;
  /** תווית בשתי שורות (Figma) — אם קיים, מוצג במקום label */
  labelLines?: [string, string];
  icon: string;
  iconRotate?: number;
  /** שורה נוספת ב-title בריחוף — אחריות פיתוח */
  devResponsibility?: string;
  /** attack = Figma 393 (43×44); ecosystem = Figma 392 (40×40 טאב) */
  variant: SidebarNavVariant;
  /** תפקיד נדרש לפתיחה — אם קיים, הפריט נעול למשתמשים ללא הרשאה */
  requiredRoleId?: RoleId;
}

export interface SidebarNavItemResolved extends SidebarNavItemDef {
  active: boolean;
  /** נעול — למשתמש אין הרשאת התפקיד הנדרש */
  locked: boolean;
  /** תווית התפקיד הנדרש לתצוגה בריחוף */
  requiredRoleLabel?: string;
}

/** פריט ניווט משני (סיידבר מישני ICT) */
export interface IctSubNavItem {
  id: string;
  label: string;
  /** SVG path data, 24×24 viewBox */
  iconPath: string;
}

/** מפרט אזורי סייד-בר לאחר resolve */
export interface ResolvedSidebarUi {
  roleId: RoleId;
  effortCategory: RoleCategory;
  effortLabel: string;
  roleLabel: string;
  /** קומפוננטות מאמץ — משותפות לכל התפקידים באותה קטגוריה */
  effortNavItems: SidebarNavItemResolved[];
  /** קומפוננטות ייחודיות לתפקיד הפעיל */
  roleNavItems: SidebarNavItemResolved[];
  /** תחתית — ניווט משותף (עץ ציוות, תחקיר), מעל קומפוזיטים */
  sharedBottomNav: SidebarNavItemResolved[];
  /** תחתית — קומפוזיטים, סדר: מלמטה למעלה (AI תחתון) */
  sharedBottom: SidebarCompositeId[];
}
