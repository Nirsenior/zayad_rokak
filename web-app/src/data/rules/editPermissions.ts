import type { RoleCategory } from '../../types/roles';

const PLANNING_PLAN_PREFIXES = ['sa7020', 'kk7020'] as const;

/** סיומת מרשם תכנון → קטגוריות שמורשות לערוך (בכל תוכנית sa7020 / kk7020) */
const PLANNING_LAYER_EDIT: Record<string, RoleCategory[]> = {
  tium: ['agam'],           // תכנון תיאום ושליטה
  mivtzaim: ['agam'],       // תכנון מבצעים ראשי
  oyev: ['modiin'],         // תכנון אויב
  'def-a': ['modiin'],      // דפ"א א
  'def-b': ['modiin'],      // דפ"א ב
  shtakh: ['modiin'],       // תכנון שטח
  esh: ['esh'],             // תכנון אש
  isuf: ['modiin'],         // תכנון איסוף
  manhala: ['manhala'],     // תכנון מנהלה
  tikshuv: ['tikshuv'],     // תכנון תקשוב
};

function buildPlanningEditPermissions(): Record<string, RoleCategory[]> {
  const out: Record<string, RoleCategory[]> = {};
  for (const prefix of PLANNING_PLAN_PREFIXES) {
    for (const [suffix, categories] of Object.entries(PLANNING_LAYER_EDIT)) {
      out[`tk-${prefix}-${suffix}`] = categories;
    }
  }
  return out;
}

// ============================================================
//  הרשאות עריכה לפי שכבה
//  מפתח = layerId, ערך = קטגוריות שמורשות לערוך
//  שכבה שלא מופיעה כאן — אין לה כלל כפתור עריכה
// ============================================================

export const EDIT_PERMISSIONS: Record<string, RoleCategory[]> = {

  // ── לחימה ──────────────────────────────────────────────────
  'l-iyumim':       ['agam', 'modiin', 'esh'],   // איתורים ואירועים
  'l-tium':         ['agam'],                     // תיאום ושליטה
  'l-ezer-lakhima': ['agam'],                     // עזר הקרב
  'l-ezer-oyev':    ['modiin'],                   // עזר האויב

  // ── מבצעים (אגם — ללא ממונה/שכנות/כפופים שאין להם עריכה) ─
  'mv-rashi':   ['agam'],
  'mv-khruqq':  ['agam'],
  'mv-hagana':  ['agam'],
  'mv-oref':    ['agam'],
  'mv-bkama':   ['agam'],
  'mv-tamakh':  ['agam'],
  'mv-ydiot':   ['agam'],
  'mv-safa':    ['agam'],

  // ── אויב (מודיעין — ללא ממונה/כפופים שאין להם עריכה) ────
  'oy-tama-rashi': ['modiin'],
  'oy-historyia':  ['modiin'],

  // ── איסוף ────────────────────────────────────────────────
  'is-tsyakhim': ['modiin'],

  // ── אש ───────────────────────────────────────────────────
  'es-matrot': ['esh'],
  // es-maagar (מאגר המטרות) — לא ניתן לעריכה

  // ── שטח (מודיעין) ────────────────────────────────────────
  'sh-idkunim':  ['modiin'],
  'sh-mistanin': ['modiin'],
  'sh-tashtyot': ['modiin'],
  'sh-takarkaa': ['modiin'],

  // ── תקשוב ────────────────────────────────────────────────
  'tk-neyakh':   ['tikshuv'],
  'tk-nayad':    ['tikshuv'],
  'tk-kesher':   ['tikshuv'],
  'tk-tashtyot': ['tikshuv'],
  'tk-mfakadot': ['tikshuv'],

  // ── מנהלה ────────────────────────────────────────────────
  'ml-network': ['manhala'],

  ...buildPlanningEditPermissions(),

  // מאגרים — אין הרשאות לאף אחד (לא מופיע → אין כפתור)
};
