/** Figma 504:106253 — הגדרות משתמש */
export const USER_SETTINGS_PANEL_W = 452.5;
export const USER_SETTINGS_PANEL_H = 230;
export const PANEL_HEADER_H = 34;
export const FIELD_W = 110;
export const FIELD_H = 25;
export const FIELD_GROUP_H = 46;
export const LABEL_H = 18;
export const COL_GAP = 11.5;
export const EMBLEM_SIZE = 50;
export const PLAN_W = 187;
export const PLAN_H = 45;

/** מיקומים יחסיים לאזור התוכן (מתחת לכותרת 34px) — Figma מינוס 714,46 ומינוס HEADER */
const T = (y: number) => y - PANEL_HEADER_H;

export const PANEL_LAYOUT = {
  row1Top: T(46),
  row2Top: T(123.5),
  emblem: { left: 391, top: T(46) },
  cell: { left: 26.5, top: T(46) },
  unit: { left: 148, top: T(46) },
  user: { left: 269.5, top: T(46) },
  plan: { left: 11.5, top: T(124.5) },
  reality: { left: 209.5, top: T(123.5) },
  role: { left: 331, top: T(123.5) },
  logout: { left: 14, top: T(197) },
} as const;

/** Figma 504:106296 */
export const LOGOUT_BTN_W = 57;
export const LOGOUT_BTN_H = 24;
