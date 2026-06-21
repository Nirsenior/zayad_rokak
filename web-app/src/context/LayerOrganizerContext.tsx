import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import type { AppMode, LayerOrganizerState, VisibilityLevel, Layer } from '../types/layers';
import { useAppSession } from './AppSessionContext';
import { resolveRoleLayerIds } from '../utils/resolveRoleLayers';
import type { PlanningEditTarget } from '../data/rules/planningEditEntities';
import {
  buildLayerOrganizerState,
  serializeOrganizerState,
  applyRoleDefaultsToFolders,
} from '../utils/buildOrganizerState';
import { loadOrganizer, saveOrganizer } from '../utils/organizerStorage';

function sessionOrganizerKey(userId: string, unitId: string) {
  return `${userId}--${unitId}`;
}

const VISIBILITY_ORDER: VisibilityLevel[] = ['techno-tactical', 'tactical-hq', 'hq-only'];

interface LayerOrganizerContextValue {
  state: LayerOrganizerState;
  toggleMode: () => void;
  setOrganizerMode: (mode: AppMode) => void;
  toggleVisibilityFilter: (level: VisibilityLevel) => void;
  setViewLevel: (level: VisibilityLevel) => void;
  toggleLayerInOrganizer: (layerId: string) => void;
  addAllNihukToOrganizer: (subFolderId?: string) => void;
  openNihukModal: (subFolderId?: string) => void;
  closeNihukModal: () => void;
  openPlanningEdit: (target: PlanningEditTarget) => void;
  closePlanningEdit: () => void;
  toggleLabels: () => void;
  toggleMainFolder: (folderId: string) => void;
  toggleSubFolder: (mainId: string, subId: string) => void;
  toggleLayerVisibility: (mainId: string, subId: string | null, layerId: string) => void;
  reorderLayersInSub: (mainId: string, subId: string, oldIdx: number, newIdx: number) => void;
  setFolderSmartEye: (folderId: string, turnOff: boolean) => void;
  setFolderAllLayers: (folderId: string, on: boolean) => void;
  setGlobalSmartEye: (turnOff: boolean) => void;
  setGlobalAllLayers: (on: boolean) => void;
  isLayerVisibleInFilter: (layer: Layer) => boolean;
  toggleSubFilter: (mainId: string, subFolderId: string | null, layerId: string, filterId: string) => void;
  createDraftLayer: (name: string) => void;
  deleteDraftLayer: (layerId: string) => void;
  resetNihukToDefault: (subFolderId?: string) => void;
  /** איפוס מרשמי ניהו"ק לברירת מחדל של התפקיד הפעיל (פעולה מפורשת בלבד) */
  applyActiveRoleDefaults: () => void;
  /** מרחיב תיקיית תכנון ותת-תוכנית — להדרכה */
  expandPlanningPlan: (subFolderId: string) => void;
  /** מוודא שמרשם תכנון מופיע בסדרן */
  ensurePlanningLayerInOrganizer: (layerId: string) => void;
  /** פותח תיקייה (ותת-תיקייה) בסדרן — להדרכה */
  expandOrganizerFolder: (mainFolderId: string, subFolderId?: string) => void;
}

const LayerOrganizerContext = createContext<LayerOrganizerContextValue | null>(null);

function getAllLayerIds(state: LayerOrganizerState): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (const folder of state.mainFolders) {
    for (const l of folder.layers) map[l.id] = l.isVisible;
    for (const sf of folder.subFolders) {
      for (const l of sf.layers) map[l.id] = l.isVisible;
    }
  }
  return map;
}

function getFolderLayerIds(state: LayerOrganizerState, folderId: string): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  const folder = state.mainFolders.find(f => f.id === folderId);
  if (!folder) return map;
  for (const l of folder.layers) map[l.id] = l.isVisible;
  for (const sf of folder.subFolders) {
    for (const l of sf.layers) map[l.id] = l.isVisible;
  }
  return map;
}

export function LayerOrganizerProvider({ children }: { children: ReactNode }) {
  const { session } = useAppSession();
  const prevSessionKeyRef = useRef(sessionOrganizerKey(session.userId, session.unitId));

  const [state, setState] = useState<LayerOrganizerState>(() =>
    buildLayerOrganizerState(loadOrganizer(session.userId, session.unitId)),
  );

  useEffect(() => {
    saveOrganizer(session.userId, session.unitId, serializeOrganizerState(state));
  }, [state, session.userId, session.unitId]);

  useEffect(() => {
    const key = sessionOrganizerKey(session.userId, session.unitId);
    if (prevSessionKeyRef.current === key) return;
    prevSessionKeyRef.current = key;
    setState(buildLayerOrganizerState(loadOrganizer(session.userId, session.unitId)));
  }, [session.userId, session.unitId]);

  const applyActiveRoleDefaults = useCallback(() => {
    const roleLayerIds = resolveRoleLayerIds(session.activeRoleId);
    setState(s => ({
      ...s,
      mainFolders: applyRoleDefaultsToFolders(s, roleLayerIds),
    }));
  }, [session.activeRoleId]); // איפוס ידני בלבד — לא נקרא בהחלפת תפקיד

  const setOrganizerMode = useCallback((mode: AppMode) => {
    setState(s => {
      if (s.mode === mode) return s;
      return {
        ...s,
        mode,
        mainFolders: s.mainFolders.map(f => {
          if (mode === 'tikhnun' && f.id === 'tikhnun') return { ...f, isExpanded: true };
          if (mode === 'nihuk' && f.id === 'nihuk') return { ...f, isExpanded: true };
          return f;
        }),
      };
    });
  }, []);

  const toggleMode = useCallback(() => {
    setState(s => {
      const mode: AppMode = s.mode === 'nihuk' ? 'tikhnun' : 'nihuk';
      return {
        ...s,
        mode,
        mainFolders: s.mainFolders.map(f => {
          if (mode === 'tikhnun' && f.id === 'tikhnun') return { ...f, isExpanded: true };
          if (mode === 'nihuk' && f.id === 'nihuk') return { ...f, isExpanded: true };
          return f;
        }),
      };
    });
  }, []);

  const toggleLayerInOrganizer = useCallback((layerId: string) => {
    setState(s => ({
      ...s,
      mainFolders: s.mainFolders.map(f => ({
        ...f,
        layers: f.layers.map(l => l.id === layerId && !l.isPermanent ? { ...l, isInOrganizer: !l.isInOrganizer } : l),
        subFolders: f.subFolders.map(sf => ({
          ...sf,
          layers: sf.layers.map(l => l.id === layerId && !l.isPermanent ? { ...l, isInOrganizer: !l.isInOrganizer } : l),
        })),
      })),
    }));
  }, []);

  const openNihukModal = useCallback((subFolderId?: string) =>
    setState(s => ({ ...s, nihukModalOpen: true, nihukModalSubFolder: subFolderId ?? null })), []);
  const closeNihukModal = useCallback(() =>
    setState(s => ({ ...s, nihukModalOpen: false, nihukModalSubFolder: null })), []);

  const openPlanningEdit = useCallback((target: PlanningEditTarget) => {
    setState(s => {
      if (s.mode !== 'tikhnun') return s;
      return {
        ...s,
        planningEditTarget: target,
        nihukModalOpen: false,
        nihukModalSubFolder: null,
      };
    });
  }, []);

  const closePlanningEdit = useCallback(() =>
    setState(s => ({ ...s, planningEditTarget: null })), []);
  const toggleLabels = useCallback(() => setState(s => ({ ...s, labelsHidden: !s.labelsHidden })), []);

  const toggleVisibilityFilter = useCallback((level: VisibilityLevel) => {
    setState(s => ({
      ...s,
      visibilityFilters: { ...s.visibilityFilters, [level]: !s.visibilityFilters[level] },
    }));
  }, []);

  const setViewLevel = useCallback((level: VisibilityLevel) => {
    const idx = VISIBILITY_ORDER.indexOf(level);
    setState(s => ({
      ...s,
      visibilityFilters: {
        'techno-tactical': idx >= 0,
        'tactical-hq': idx >= 1,
        'hq-only': idx >= 2,
      },
    }));
  }, []);

  const toggleMainFolder = useCallback((folderId: string) => {
    setState(s => ({
      ...s,
      mainFolders: s.mainFolders.map(f =>
        f.id === folderId ? { ...f, isExpanded: !f.isExpanded } : f,
      ),
    }));
  }, []);

  const toggleSubFolder = useCallback((mainId: string, subId: string) => {
    setState(s => ({
      ...s,
      mainFolders: s.mainFolders.map(f =>
        f.id !== mainId ? f : {
          ...f,
          subFolders: f.subFolders.map(sf =>
            sf.id === subId ? { ...sf, isExpanded: !sf.isExpanded } : sf,
          ),
        },
      ),
    }));
  }, []);

  const toggleLayerVisibility = useCallback(
    (mainId: string, subId: string | null, layerId: string) => {
      setState(s => ({
        ...s,
        mainFolders: s.mainFolders.map(f => {
          if (f.id !== mainId) return f;
          if (subId === null) {
            return { ...f, layers: f.layers.map(l => l.id === layerId ? { ...l, isVisible: !l.isVisible } : l) };
          }
          return {
            ...f,
            subFolders: f.subFolders.map(sf =>
              sf.id !== subId ? sf : {
                ...sf,
                layers: sf.layers.map(l => l.id === layerId ? { ...l, isVisible: !l.isVisible } : l),
              },
            ),
          };
        }),
      }));
    },
    [],
  );

  const reorderLayersInSub = useCallback(
    (mainId: string, subId: string, oldIdx: number, newIdx: number) => {
      setState(s => ({
        ...s,
        mainFolders: s.mainFolders.map(f =>
          f.id !== mainId ? f : {
            ...f,
            subFolders: f.subFolders.map(sf =>
              sf.id !== subId ? sf : { ...sf, layers: arrayMove(sf.layers, oldIdx, newIdx) },
            ),
          },
        ),
      }));
    },
    [],
  );

  const setFolderSmartEye = useCallback((folderId: string, turnOff: boolean) => {
    setState(s => {
      if (turnOff) {
        const currentMap = getFolderLayerIds(s, folderId);
        return {
          ...s,
          folderEyeOff: { ...s.folderEyeOff, [folderId]: true },
          folderSavedVisibility: { ...s.folderSavedVisibility, [folderId]: currentMap },
          mainFolders: s.mainFolders.map(f =>
            f.id !== folderId ? f : {
              ...f,
              layers: f.layers.map(l => ({ ...l, isVisible: false })),
              subFolders: f.subFolders.map(sf => ({
                ...sf,
                layers: sf.layers.map(l => ({ ...l, isVisible: false })),
              })),
            },
          ),
        };
      }
      const saved = s.folderSavedVisibility[folderId] ?? {};
      return {
        ...s,
        folderEyeOff: { ...s.folderEyeOff, [folderId]: false },
        mainFolders: s.mainFolders.map(f =>
          f.id !== folderId ? f : {
            ...f,
            layers: f.layers.map(l => ({ ...l, isVisible: saved[l.id] ?? l.isVisible })),
            subFolders: f.subFolders.map(sf => ({
              ...sf,
              layers: sf.layers.map(l => ({ ...l, isVisible: saved[l.id] ?? l.isVisible })),
            })),
          },
        ),
      };
    });
  }, []);

  const setFolderAllLayers = useCallback((folderId: string, on: boolean) => {
    setState(s => ({
      ...s,
      mainFolders: s.mainFolders.map(f =>
        f.id !== folderId ? f : {
          ...f,
          layers: f.layers.map(l => ({ ...l, isVisible: on })),
          subFolders: f.subFolders.map(sf => ({
            ...sf,
            layers: sf.layers.map(l => ({ ...l, isVisible: on })),
          })),
        },
      ),
    }));
  }, []);

  const setGlobalSmartEye = useCallback((turnOff: boolean) => {
    setState(s => {
      if (turnOff) {
        const saved = getAllLayerIds(s);
        return {
          ...s,
          globalEyeOff: true,
          globalSavedVisibility: saved,
          mainFolders: s.mainFolders.map(f => ({
            ...f,
            layers: f.layers.map(l => ({ ...l, isVisible: false })),
            subFolders: f.subFolders.map(sf => ({
              ...sf,
              layers: sf.layers.map(l => ({ ...l, isVisible: false })),
            })),
          })),
        };
      }
      const saved = s.globalSavedVisibility;
      return {
        ...s,
        globalEyeOff: false,
        mainFolders: s.mainFolders.map(f => ({
          ...f,
          layers: f.layers.map(l => ({ ...l, isVisible: saved[l.id] ?? l.isVisible })),
          subFolders: f.subFolders.map(sf => ({
            ...sf,
            layers: sf.layers.map(l => ({ ...l, isVisible: saved[l.id] ?? l.isVisible })),
          })),
        })),
      };
    });
  }, []);

  const setGlobalAllLayers = useCallback((on: boolean) => {
    setState(s => ({
      ...s,
      mainFolders: s.mainFolders.map(f => ({
        ...f,
        layers: f.layers.map(l => ({ ...l, isVisible: on })),
        subFolders: f.subFolders.map(sf => ({
          ...sf,
          layers: sf.layers.map(l => ({ ...l, isVisible: on })),
        })),
      })),
    }));
  }, []);

  const isLayerVisibleInFilter = useCallback((layer: { visibility: string }) => {
    return state.visibilityFilters[layer.visibility as VisibilityLevel] ?? true;
  }, [state.visibilityFilters]);

  const toggleSubFilter = useCallback(
    (mainId: string, subFolderId: string | null, layerId: string, filterId: string) => {
      setState(s => ({
        ...s,
        mainFolders: s.mainFolders.map(f => {
          if (f.id !== mainId) return f;
          const patchLayer = (l: Layer) =>
            l.id !== layerId ? l : {
              ...l,
              subFilters: l.subFilters?.map(sf =>
                sf.id === filterId ? { ...sf, isActive: !sf.isActive } : sf,
              ),
            };
          if (subFolderId === null) {
            return { ...f, layers: f.layers.map(patchLayer) };
          }
          return {
            ...f,
            subFolders: f.subFolders.map(sf =>
              sf.id !== subFolderId ? sf : { ...sf, layers: sf.layers.map(patchLayer) },
            ),
          };
        }),
      }));
    },
    [],
  );

  const createDraftLayer = useCallback((name: string) => {
    const id = `sy-${Date.now()}`;
    setState(s => ({
      ...s,
      mainFolders: s.mainFolders.map(f =>
        f.id !== 'nihuk' ? f : {
          ...f,
          subFolders: f.subFolders.map(sf =>
            sf.id !== 'siyuta' ? sf : {
              ...sf,
              isExpanded: true,
              layers: [...sf.layers, {
                id,
                name,
                color: '#4a5568',
                isEditable: true,
                visibility: 'hq-only' as const,
                sharing: 'unit' as const,
                isVisible: false,
                isPermanent: false,
                isInOrganizer: true,
              }],
            },
          ),
        },
      ),
    }));
  }, []);

  const deleteDraftLayer = useCallback((layerId: string) => {
    setState(s => ({
      ...s,
      mainFolders: s.mainFolders.map(f =>
        f.id !== 'nihuk' ? f : {
          ...f,
          subFolders: f.subFolders.map(sf =>
            sf.id !== 'siyuta' ? sf : {
              ...sf,
              layers: sf.layers.filter(l => l.id !== layerId),
            },
          ),
        },
      ),
    }));
  }, []);

  const addAllNihukToOrganizer = useCallback((subFolderId?: string) => {
    setState(s => ({
      ...s,
      mainFolders: s.mainFolders.map(f => {
        if (f.id !== 'nihuk') return f;
        return {
          ...f,
          subFolders: f.subFolders.map(sf => {
            if (subFolderId && sf.id !== subFolderId) return sf;
            return { ...sf, layers: sf.layers.map(l => ({ ...l, isInOrganizer: true })) };
          }),
        };
      }),
    }));
  }, []);

  const resetNihukToDefault = useCallback((subFolderId?: string) => {
    const roleLayerIds = resolveRoleLayerIds(session.activeRoleId);
    setState(s => ({
      ...s,
      mainFolders: applyRoleDefaultsToFolders(s, roleLayerIds, subFolderId),
    }));
  }, [session.activeRoleId]);

  const expandPlanningPlan = useCallback((subFolderId: string) => {
    setState(s => ({
      ...s,
      mode: 'tikhnun',
      mainFolders: s.mainFolders.map(f =>
        f.id !== 'tikhnun'
          ? f
          : {
              ...f,
              isExpanded: true,
              subFolders: f.subFolders.map(sf =>
                sf.id === subFolderId ? { ...sf, isExpanded: true } : sf,
              ),
            },
      ),
    }));
  }, []);

  const ensurePlanningLayerInOrganizer = useCallback((layerId: string) => {
    setState(s => ({
      ...s,
      mainFolders: s.mainFolders.map(f => ({
        ...f,
        layers: f.layers.map(l =>
          l.id === layerId ? { ...l, isInOrganizer: true } : l,
        ),
        subFolders: f.subFolders.map(sf => ({
          ...sf,
          layers: sf.layers.map(l =>
            l.id === layerId ? { ...l, isInOrganizer: true } : l,
          ),
        })),
      })),
    }));
  }, []);

  const expandOrganizerFolder = useCallback((mainFolderId: string, subFolderId?: string) => {
    setState(s => ({
      ...s,
      mainFolders: s.mainFolders.map(f => {
        if (f.id !== mainFolderId) return f;
        return {
          ...f,
          isExpanded: true,
          subFolders: subFolderId
            ? f.subFolders.map(sf =>
                sf.id === subFolderId ? { ...sf, isExpanded: true } : sf,
              )
            : f.subFolders,
        };
      }),
    }));
  }, []);

  return (
    <LayerOrganizerContext.Provider value={{
      state,
      toggleMode,
      setOrganizerMode,
      toggleVisibilityFilter,
      setViewLevel,
      toggleLayerInOrganizer,
      openNihukModal,
      closeNihukModal,
      openPlanningEdit,
      closePlanningEdit,
      toggleLabels,
      toggleMainFolder,
      toggleSubFolder,
      toggleLayerVisibility,
      reorderLayersInSub,
      setFolderSmartEye,
      setFolderAllLayers,
      setGlobalSmartEye,
      setGlobalAllLayers,
      isLayerVisibleInFilter,
      toggleSubFilter,
      createDraftLayer,
      deleteDraftLayer,
      addAllNihukToOrganizer,
      resetNihukToDefault,
      applyActiveRoleDefaults,
      expandPlanningPlan,
      ensurePlanningLayerInOrganizer,
      expandOrganizerFolder,
    }}>
      {children}
    </LayerOrganizerContext.Provider>
  );
}

export function useLayerOrganizer() {
  const ctx = useContext(LayerOrganizerContext);
  if (!ctx) throw new Error('useLayerOrganizer must be used inside LayerOrganizerProvider');
  return ctx;
}

/** @deprecated Use useLayerOrganizer */
export const useLayerContext = useLayerOrganizer;
