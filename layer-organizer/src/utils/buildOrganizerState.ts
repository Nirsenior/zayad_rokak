import type { Layer, LayerOrganizerState, MainFolder } from '../types/layers';
import { initialMainFolders } from '../data/catalog/layers';

const PLANNING_FOLDER_ID = 'tikhnun';

function resolveIsInOrganizer(
  layer: Layer,
  mainFolderId: string,
  persisted: PersistedOrganizer | null,
  ignoreTikhnunPersistedFalse: boolean,
): boolean {
  if (layer.isPermanent) return true;
  if (mainFolderId === PLANNING_FOLDER_ID) {
    const persistedFlag = persisted?.layerInOrganizer?.[layer.id];
    if (persistedFlag === true) return true;
    if (persistedFlag === false && !ignoreTikhnunPersistedFalse) return false;
    return layer.isInOrganizer;
  }
  if (persisted?.layerInOrganizer?.[layer.id] !== undefined) {
    return persisted.layerInOrganizer[layer.id];
  }
  return layer.isInOrganizer;
}

/** localStorage ישן שמר false לכל שכבות תכנון כי לא היו ב-roleDefaults */
function isTikhnunOrganizerPoisoned(
  folders: MainFolder[],
  persisted: PersistedOrganizer | null,
): boolean {
  const layerInOrganizer = persisted?.layerInOrganizer;
  if (!layerInOrganizer) return false;
  const tikhnun = folders.find(f => f.id === PLANNING_FOLDER_ID);
  if (!tikhnun) return false;
  const ids = tikhnun.subFolders.flatMap(sf => sf.layers.map(l => l.id));
  if (ids.length === 0) return false;
  return ids.every(id => layerInOrganizer[id] === false);
}

export interface PersistedOrganizer {
  mode: LayerOrganizerState['mode'];
  globalEyeOff: boolean;
  globalSavedVisibility: Record<string, boolean>;
  folderEyeOff: Record<string, boolean>;
  folderSavedVisibility: Record<string, Record<string, boolean>>;
  layerVisibility: Record<string, boolean>;
  layerInOrganizer: Record<string, boolean>;
  folderExpanded: Record<string, boolean>;
  subFolderExpanded: Record<string, boolean>;
}

/** בונה מצב סדרן — העדפות מ-localStorage לפי משתמש+יחידה, לא לפי תפקיד */
export function buildLayerOrganizerState(
  persisted: PersistedOrganizer | null,
): LayerOrganizerState {
  const ignoreTikhnunPersistedFalse = isTikhnunOrganizerPoisoned(initialMainFolders, persisted);

  const mainFolders = initialMainFolders.map(f => ({
    ...f,
    isExpanded: persisted?.folderExpanded[f.id] ?? f.isExpanded,
    layers: f.layers.map(l => ({
      ...l,
      isVisible: persisted?.layerVisibility[l.id] ?? l.isVisible,
      isInOrganizer: resolveIsInOrganizer(
        l,
        f.id,
        persisted,
        ignoreTikhnunPersistedFalse,
      ),
    })),
    subFolders: f.subFolders.map(sf => ({
      ...sf,
      isExpanded: persisted?.subFolderExpanded[sf.id] ?? sf.isExpanded,
      layers: sf.layers.map(l => ({
        ...l,
        isVisible: persisted?.layerVisibility[l.id] ?? l.isVisible,
        isInOrganizer: resolveIsInOrganizer(
          l,
          f.id,
          persisted,
          ignoreTikhnunPersistedFalse,
        ),
      })),
    })),
  }));

  return {
    mode: persisted?.mode ?? 'nihuk',
    visibilityFilters: { 'techno-tactical': true, 'tactical-hq': true, 'hq-only': true },
    mainFolders,
    folderEyeOff: persisted?.folderEyeOff ?? {},
    folderSavedVisibility: persisted?.folderSavedVisibility ?? {},
    globalEyeOff: persisted?.globalEyeOff ?? false,
    globalSavedVisibility: persisted?.globalSavedVisibility ?? {},
    nihukModalOpen: false,
    nihukModalSubFolder: null,
    planningEditTarget: null,
    labelsHidden: false,
  };
}

export function serializeOrganizerState(state: LayerOrganizerState): PersistedOrganizer {
  const layerVisibility: Record<string, boolean> = {};
  const layerInOrganizer: Record<string, boolean> = {};
  const folderExpanded: Record<string, boolean> = {};
  const subFolderExpanded: Record<string, boolean> = {};

  for (const f of state.mainFolders) {
    folderExpanded[f.id] = f.isExpanded;
    for (const l of f.layers) {
      layerVisibility[l.id] = l.isVisible;
      layerInOrganizer[l.id] = l.isInOrganizer;
    }
    for (const sf of f.subFolders) {
      subFolderExpanded[sf.id] = sf.isExpanded;
      for (const l of sf.layers) {
        layerVisibility[l.id] = l.isVisible;
        layerInOrganizer[l.id] = l.isInOrganizer;
      }
    }
  }

  return {
    mode: state.mode,
    globalEyeOff: state.globalEyeOff,
    globalSavedVisibility: state.globalSavedVisibility,
    folderEyeOff: state.folderEyeOff,
    folderSavedVisibility: state.folderSavedVisibility,
    layerVisibility,
    layerInOrganizer,
    folderExpanded,
    subFolderExpanded,
  };
}

/** מעדכן isInOrganizer לפי תפקיד — רק בפעולת איפוס מפורשת (לא בהחלפת Mission Plan) */
export function applyRoleDefaultsToFolders(
  state: LayerOrganizerState,
  roleLayerIds: Set<string>,
  subFolderId?: string,
): LayerOrganizerState['mainFolders'] {
  return state.mainFolders.map(f => {
    if (f.id !== 'nihuk') return f;
    return {
      ...f,
      subFolders: f.subFolders.map(sf => {
        if (subFolderId && sf.id !== subFolderId) return sf;
        return {
          ...sf,
          layers: sf.layers.map(l => ({
            ...l,
            isInOrganizer: l.isPermanent || roleLayerIds.has(l.id),
          })),
        };
      }),
    };
  });
}
