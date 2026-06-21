/** שכבות תכנון שפותחות עורך יישויות (חלון צף) */
export type PlanningEditSuffix = 'shtakh' | 'oyev' | 'mivtzaim';

export interface PlanningEditEntity {
  id: string;
  label: string;
  icon: 'pentagon' | 'axis' | 'area-control' | 'destruction' | 'enemy-staging' | 'objective' | 'arrow' | 'phase-line';
}

export interface PlanningEditTarget {
  layerId: string;
  layerName: string;
  planName: string;
  suffix: PlanningEditSuffix;
}

const PLANNING_EDIT_SUFFIXES: PlanningEditSuffix[] = ['shtakh', 'oyev', 'mivtzaim'];

export function getPlanningEditSuffix(layerId: string): PlanningEditSuffix | null {
  const m = layerId.match(/^tk-(?:sa7020|kk7020)-(.+)$/);
  if (!m) return null;
  const suffix = m[1] as PlanningEditSuffix;
  return PLANNING_EDIT_SUFFIXES.includes(suffix) ? suffix : null;
}

export function canOpenPlanningEntityEditor(layerId: string): boolean {
  return getPlanningEditSuffix(layerId) !== null;
}

const ENTITIES: Record<PlanningEditSuffix, { sectionTitle: string; items: PlanningEditEntity[] }> = {
  shtakh: {
    sectionTitle: 'יישויות שטח',
    items: [
      { id: 'shtakh-cell', label: 'תאי שטח', icon: 'pentagon' },
      { id: 'shtakh-axis', label: 'צירים', icon: 'axis' },
      { id: 'shtakh-dominant', label: 'שטחים שולטים', icon: 'area-control' },
      { id: 'shtakh-destruction', label: 'שטחי השמדה', icon: 'destruction' },
    ],
  },
  oyev: {
    sectionTitle: 'יישויות אויב',
    items: [
      { id: 'oyev-staging', label: 'מרחב היערכות אויב', icon: 'enemy-staging' },
    ],
  },
  mivtzaim: {
    sectionTitle: 'יישויות מבצע',
    items: [
      { id: 'mv-objective', label: 'יעד כיבוש', icon: 'objective' },
      { id: 'mv-arrow', label: 'חץ', icon: 'arrow' },
      { id: 'mv-phase-line', label: 'קו שלב', icon: 'phase-line' },
    ],
  },
};

export function getPlanningEditEntities(suffix: PlanningEditSuffix) {
  return ENTITIES[suffix];
}

export const ADVANCED_PLANNING_BY_SUFFIX: Record<
  PlanningEditSuffix,
  { label: string; tooltip: string }
> = {
  shtakh: {
    label: 'תכנון שטח מתקדם',
    tooltip: 'תכנון שטח בעזרת AI',
  },
  oyev: {
    label: 'תכנון אויב מתקדם',
    tooltip:
      'תכנון אויב בעזרת AI. תכנון זה מתחשב בנספח השטח, וודא שנספח השטח מעודכן',
  },
  mivtzaim: {
    label: 'תכנון מבצעים ראשי מתקדם',
    tooltip:
      'תכנון מבצעים ראשי על ידי AI. תכנון זה מתבסס על נספח השטח והאויב. וודא שנספחים אלה מעודכנים',
  },
};

export function getAdvancedPlanningCopy(suffix: PlanningEditSuffix) {
  return ADVANCED_PLANNING_BY_SUFFIX[suffix];
}
