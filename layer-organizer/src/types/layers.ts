import type { PlanningEditTarget } from '../data/rules/planningEditEntities';

export type { PlanningEditTarget };

export type AppMode = 'nihuk' | 'tikhnun';

export type VisibilityLevel =
  | 'techno-tactical'
  | 'tactical-hq'
  | 'hq-only';

export type SharingMode = 'unit' | 'brigade' | 'pool';

export interface SubFilter {
  id: string;
  label: string;
  isActive: boolean;
}

export interface Layer {
  id: string;
  name: string;
  color: string;
  isEditable: boolean;
  visibility: VisibilityLevel;
  sharing: SharingMode | null;
  isVisible: boolean;
  isPermanent: boolean;
  isInOrganizer: boolean;
  subFilters?: SubFilter[];
}

export interface SubFolder {
  id: string;
  name: string;
  layers: Layer[];
  isExpanded: boolean;
}

export interface MainFolder {
  id: string;
  name: string;
  layers: Layer[];
  subFolders: SubFolder[];
  isExpanded: boolean;
}

/** מצב ריצה של סדרן השכבות בלבד */
export interface LayerOrganizerState {
  mode: AppMode;
  visibilityFilters: Record<VisibilityLevel, boolean>;
  mainFolders: MainFolder[];
  folderEyeOff: Record<string, boolean>;
  folderSavedVisibility: Record<string, Record<string, boolean>>;
  globalEyeOff: boolean;
  globalSavedVisibility: Record<string, boolean>;
  nihukModalOpen: boolean;
  nihukModalSubFolder: string | null;
  planningEditTarget: PlanningEditTarget | null;
  labelsHidden: boolean;
}
