/** טיפוגרפיה משותפת — Figma 207:42235 (כפתור + דרופדאון) */
export const MP_FONT_FAMILY = 'Assistant, var(--ds-font)';

export const MP_TEXT_SIZE = 16;
export const MP_CATEGORY_SIZE = 12;

/** כפתור + שורה פעילה */
export const MP_TEXT_ACTIVE = {
  fontFamily: MP_FONT_FAMILY,
  fontSize: MP_TEXT_SIZE,
  fontWeight: 600,
  lineHeight: 'normal' as const,
  color: '#fff',
};

/** שורות לא פעילות — Assistant 16 כמו הכפתור, צבע משני */
export const MP_TEXT_ROW = {
  fontFamily: MP_FONT_FAMILY,
  fontSize: MP_TEXT_SIZE,
  fontWeight: 400,
  lineHeight: 'normal' as const,
  color: '#e8e8ec',
};

/** כותרת קטגוריה */
export const MP_TEXT_CATEGORY = {
  fontFamily: MP_FONT_FAMILY,
  fontSize: MP_CATEGORY_SIZE,
  fontWeight: 400,
  lineHeight: 'normal' as const,
  color: '#c5c6ca',
};
