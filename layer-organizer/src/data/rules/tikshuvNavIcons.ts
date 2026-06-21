import { figmaAssets } from '../../assets/figmaAssets';
import type { SidebarNavItemId } from '../../types/sidebarUi';

/**
 * אייקוני סיידבר תקשוב — מיפוי קבוע לפי כותרת (לא לפי שם קובץ Figma המקורי).
 * ראה docs/PRD_ICT.MD §מיפוי אייקונים.
 */
export const TIKSHUV_NAV_ICON: Partial<Record<SidebarNavItemId, string>> = {
  'shell.sidebar.nav.item.ict.dashboard': figmaAssets.ictNavDashboard,
  'shell.sidebar.nav.item.ict.planning': figmaAssets.ictNavPlanning,
  'shell.sidebar.nav.item.ict.effortSync': figmaAssets.ictNavSync,
  'shell.sidebar.nav.item.ict.radio': figmaAssets.ictNavRadio,
  'shell.sidebar.nav.item.ict.spectrum': figmaAssets.ictNavSpectrum,
  'shell.sidebar.nav.item.ict.monitor': figmaAssets.ictNavMonitor,
  'shell.sidebar.nav.item.ict.crewSupport': figmaAssets.ictNavCrewSupport,
  'shell.sidebar.nav.item.ict.lomer': figmaAssets.ictNavLomer,
  'shell.sidebar.nav.item.ict.manhala': figmaAssets.ictNavManhala,
};

export function getTikshuvNavIcon(id: SidebarNavItemId): string | undefined {
  return TIKSHUV_NAV_ICON[id];
}
