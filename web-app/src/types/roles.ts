/** קטגוריית הרשאות (אג"ם, מודיעין…) — לא יחידה ארגונית */
export type RoleCategory = 'orekh' | 'agam' | 'oref' | 'modiin' | 'esh' | 'tikshuv' | 'manhala';

/** תפקיד פעיל = סוג הרשאות (Mission Plan) */
export type RoleId =
  | 'guest'
  | 'agam-rashi' | 'oref' | 'ukhlusiya' | 'rokak' | 'handasa' | 'nihul-maarechet'
  | 'modiin-rashi'
  | 'mikhlol-haesh' | 'yabasha' | 'avir'
  | 'tikshuv-rashi'
  | 'spektrum'
  | 'ta-shlita'
  | 'ta-radio'
  | 'retzifut-tipul'
  | 'hafala'
  | 'moked-nitur'
  | 'ta-tikhnun'
  | 'shuv'
  | 'shulkhan-merkazi' | 'logistika' | 'refua' | 'tana' | 'masan';

export interface RoleCategoryDef {
  id: RoleCategory;
  label: string;
  roles: { id: RoleId; label: string }[];
}

export const ROLE_CATEGORIES: RoleCategoryDef[] = [
  {
    id: 'orekh',
    label: 'אורח',
    roles: [{ id: 'guest', label: 'אורח' }],
  },
  {
    id: 'agam',
    label: 'אג"ם',
    roles: [
      { id: 'agam-rashi', label: 'אגם ראשי' },
      { id: 'oref', label: 'עורף' },
      { id: 'ukhlusiya', label: 'אוכלוסיה' },
      { id: 'rokak', label: 'רוק"ק' },
      { id: 'handasa', label: 'הנדסה' },
      { id: 'nihul-maarechet', label: 'ניהול מערכת' },
    ],
  },
  {
    id: 'modiin',
    label: 'מודיעין',
    roles: [{ id: 'modiin-rashi', label: 'מודיעין ראשי' }],
  },
  {
    id: 'esh',
    label: 'אש',
    roles: [
      { id: 'mikhlol-haesh', label: 'מכלול האש' },
      { id: 'yabasha', label: 'יבשה' },
      { id: 'avir', label: 'אוויר' },
    ],
  },
  {
    id: 'tikshuv',
    label: 'תקשוב',
    roles: [
      { id: 'tikshuv-rashi', label: 'תקשוב ראשי' },
      { id: 'spektrum', label: 'ספקטרום' },
      { id: 'ta-shlita', label: 'תא שליטה' },
      { id: 'ta-radio', label: 'תא רדיו' },
      { id: 'retzifut-tipul', label: 'רציפות התפקוד' },
      { id: 'hafala', label: 'הפעלה' },
      { id: 'moked-nitur', label: 'מוקד ניטור' },
      { id: 'ta-tikhnun', label: 'תא תכנון' },
      { id: 'shuv', label: 'שו"ב' },
    ],
  },
  {
    id: 'manhala',
    label: 'מנהלה',
    roles: [
      { id: 'shulkhan-merkazi', label: 'שולחן מרכזי' },
      { id: 'logistika', label: 'לוגיסטיקה' },
      { id: 'refua', label: 'רפואה' },
      { id: 'tana', label: 'טנ"א' },
      { id: 'masan', label: 'משא"ן' },
    ],
  },
];

export function getRoleLabel(roleId: RoleId): string {
  for (const cat of ROLE_CATEGORIES) {
    const r = cat.roles.find(role => role.id === roleId);
    if (r) return r.label;
  }
  return roleId;
}

export function getRoleCategory(roleId: RoleId): RoleCategory | null {
  const cat = ROLE_CATEGORIES.find(c => c.roles.some(r => r.id === roleId));
  return cat?.id ?? null;
}

/** כל מזהי התפקידים (כולל אורח) */
export const ALL_ROLE_IDS: RoleId[] = ROLE_CATEGORIES.flatMap(c => c.roles.map(r => r.id));

/** @deprecated Use RoleId */
export type UserType = RoleId;
/** @deprecated Use RoleCategory */
export type UserCategory = RoleCategory;
/** @deprecated Use ROLE_CATEGORIES */
export const USER_CATEGORIES = ROLE_CATEGORIES;
/** @deprecated Use getRoleLabel */
export const getUserLabel = getRoleLabel;
