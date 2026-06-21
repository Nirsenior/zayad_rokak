/** מיקומי סיידבר — Figma 1920×1080 */
export const HEADER_H = 46;
export const MAIN_MENU_LEFT = 1856;
export const MAIN_MENU_W = 64;

/** סיידבר תחקיר מקביל — Figma 393:37071 (צמוד לראשי, מורחב מעט) */
export const TAHKIR_SIDEBAR_W = 84;
/** חפיפה של 2px עם הסיידבר הראשי — ללא רווח ויזואלי */
export const TAHKIR_SIDEBAR_MAIN_OVERLAP = 2;
/** מתחיל ב-y=44 — נוגע בטופ-בר (Figma 393:37071) */
export const TAHKIR_SIDEBAR_TOP = 44;

/** חלונית יצירת תחקיר — Figma 393:30622 */
export const TAHKIR_CREATE_PANEL_W = 412;

/** פס ציר זמן — Figma 386:90031 */
export const TAHKIR_TIMELINE_H = 72;
export const TAHKIR_TIMELINE_LEFT = 8;

/** סיידבר מישני ICT — נפתח משמאל לסיידבר הראשי */
export const ICT_SECONDARY_SIDEBAR_W = 200;

/** כפתור סדרן מרשמים — Figma, משמאל לסיידבר הראשי */
export const LAYERS_TOGGLE_BASE_LEFT = 1806;
export const LAYERS_TOGGLE_SIZE = 44;

export function tahkirSidebarTop(): number {
  return TAHKIR_SIDEBAR_TOP;
}

export function tahkirSidebarHeight(canvasHeight: number): number {
  return canvasHeight - TAHKIR_SIDEBAR_TOP;
}

/** סיידבר משני צמוד לראשי (חפיפה קלה) */
export function tahkirSidebarLeft(): number {
  return MAIN_MENU_LEFT - TAHKIR_SIDEBAR_W + TAHKIR_SIDEBAR_MAIN_OVERLAP;
}

/** חלונית יצירה — משמאל לסיידבר המשני */
export function tahkirCreatePanelLeft(): number {
  return tahkirSidebarLeft() - TAHKIR_CREATE_PANEL_W;
}

/** מיקום כפתור סדרן — מוזז ימינה כשהסיידבר הראשי מקופל */
export function layersToggleLeft(
  mainSidebarOpen: boolean,
  tahkirSidebarOpen: boolean,
  createPanelOpen: boolean,
  ictSecondaryOpen: boolean = false,
): number {
  let left = LAYERS_TOGGLE_BASE_LEFT;
  if (!mainSidebarOpen) left += MAIN_MENU_W;
  if (tahkirSidebarOpen) left -= TAHKIR_SIDEBAR_W;
  if (createPanelOpen) left -= TAHKIR_CREATE_PANEL_W;
  if (ictSecondaryOpen) left -= ICT_SECONDARY_SIDEBAR_W;
  return left;
}

/** inset מימין לעוגן סדרן / רוחב ציר זמן */
export function tahkirChromeRightInset(
  mainSidebarOpen: boolean,
  tahkirSidebarOpen: boolean,
  createPanelOpen: boolean,
  ictSecondaryOpen: boolean = false,
): number {
  let inset = 0;
  if (mainSidebarOpen) inset += MAIN_MENU_W;
  if (tahkirSidebarOpen) inset += TAHKIR_SIDEBAR_W;
  if (createPanelOpen) inset += TAHKIR_CREATE_PANEL_W;
  if (ictSecondaryOpen) inset += ICT_SECONDARY_SIDEBAR_W;
  return inset;
}

export function organizerAnchorRight(
  mainSidebarOpen: boolean,
  tahkirSidebarOpen: boolean,
  createPanelOpen: boolean,
  ictSecondaryOpen: boolean = false,
): number {
  return tahkirChromeRightInset(mainSidebarOpen, tahkirSidebarOpen, createPanelOpen, ictSecondaryOpen);
}

/** מיקום X של הסיידבר המישני ICT — צמוד לשמאל הסיידבר הראשי */
export function ictSecondarySidebarLeft(): number {
  return MAIN_MENU_LEFT - ICT_SECONDARY_SIDEBAR_W;
}
