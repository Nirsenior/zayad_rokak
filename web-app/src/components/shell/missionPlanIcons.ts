import type { RoleCategory } from '../../types/roles';
import { figmaAssets } from '../../assets/figmaAssets';

/** כפתור + דרופדאון — אותו רוחב (Figma 392:30665 / 207:42235) */
export const MISSION_PLAN_BUTTON_W = 180;
export const MISSION_PLAN_BUTTON_H = 38;

export const MISSION_PLAN_DROPDOWN_W = MISSION_PLAN_BUTTON_W;
export const MISSION_PLAN_DROPDOWN_OFFSET_TOP = 7;
export const MISSION_PLAN_DROPDOWN_OFFSET_RIGHT = -3.5;

export const MISSION_PLAN_ROW_H = 32;
export const MISSION_PLAN_ICON = 22;
export const MISSION_PLAN_PANEL_PAD_X = 10;
export const MISSION_PLAN_PANEL_PAD_Y = 8;
export const MISSION_PLAN_PANEL_MAX_H = 320;

/** @deprecated Use MISSION_PLAN_DROPDOWN_W */
export const MISSION_PLAN_WIDTH = MISSION_PLAN_DROPDOWN_W;

const CATEGORY_ICON: Record<RoleCategory, string> = {
  orekh: figmaAssets.mpIconPerson,
  agam: figmaAssets.mpIconAgam,
  oref: figmaAssets.mpIconAgam,
  modiin: figmaAssets.mpIconSword,
  esh: figmaAssets.mpIconAir,
  tikshuv: figmaAssets.mpIconElectricity,
  manhala: figmaAssets.mpIconShield,
};

export function getMissionPlanCategoryIcon(categoryId: RoleCategory): string {
  return CATEGORY_ICON[categoryId];
}
