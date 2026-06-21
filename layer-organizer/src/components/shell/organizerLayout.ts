/** מידות פריסת סדרן — מסונכרן עם AppShell */
export const ORGANIZER_OPTIONS_WIDTH = 40;
export const ORGANIZER_PANEL_WIDTH = 328;
export const ORGANIZER_BLOCK_WIDTH = ORGANIZER_OPTIONS_WIDTH + ORGANIZER_PANEL_WIDTH;
export const PLANNING_EDIT_PANEL_WIDTH = 360;
export const PLANNING_EDIT_GAP = 8;
export const PLANNING_EDIT_TOP = 54; // מתחת לכותרת (46) + מרווח

export function planningEditDefaultRight(organizerAnchorRight: number): number {
  return organizerAnchorRight + ORGANIZER_BLOCK_WIDTH + PLANNING_EDIT_GAP;
}
