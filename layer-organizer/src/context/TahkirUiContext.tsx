import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export type TahkirToolId = 'timeline' | 'create' | 'space';

interface TahkirUiContextValue {
  sidebarOpen: boolean;
  timelineOpen: boolean;
  createOpen: boolean;
  tahkirLayerOpen: boolean;
  spaceActive: boolean;
  activeTool: TahkirToolId | null;
  toggleSidebar: () => void;
  toggleTimeline: () => void;
  toggleCreate: () => void;
  closeCreate: () => void;
  toggleSpace: () => void;
  toggleTahkirLayer: () => void;
  /** סוגר סיידבר תחקור, פאנלים ומצב כלים */
  closeTahkirChrome: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTimelineOpen: (open: boolean) => void;
  setCreateOpen: (open: boolean) => void;
  setSpaceActive: (active: boolean) => void;
  setTahkirLayerPanelOpen: (open: boolean) => void;
}

const TahkirUiContext = createContext<TahkirUiContextValue | null>(null);

export function TahkirUiProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [tahkirLayerOpen, setTahkirLayerOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<TahkirToolId | null>(null);

  const resetTahkirSession = useCallback(() => {
    setTimelineOpen(false);
    setCreateOpen(false);
    setTahkirLayerOpen(false);
    setActiveTool(null);
  }, []);

  const closeTahkirChrome = useCallback(() => {
    setSidebarOpen(false);
    resetTahkirSession();
  }, [resetTahkirSession]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => {
      if (prev) {
        resetTahkirSession();
        return false;
      }
      return true;
    });
  }, [resetTahkirSession]);

  const toggleTimeline = useCallback(() => {
    setTimelineOpen(prev => {
      const next = !prev;
      setActiveTool(cur => (next ? 'timeline' : cur === 'timeline' ? null : cur));
      return next;
    });
  }, []);

  const toggleCreate = useCallback(() => {
    setCreateOpen(prev => {
      const next = !prev;
      setActiveTool(cur => (next ? 'create' : cur === 'create' ? null : cur));
      return next;
    });
  }, []);

  const closeCreate = useCallback(() => {
    setCreateOpen(false);
    setActiveTool(t => (t === 'create' ? null : t));
  }, []);

  const toggleSpace = useCallback(() => {
    setActiveTool(cur => {
      if (cur === 'space') return null;
      setCreateOpen(false);
      return 'space';
    });
  }, []);

  const toggleTahkirLayer = useCallback(() => {
    setTahkirLayerOpen(prev => !prev);
  }, []);

  const setSidebarOpenExplicit = useCallback((open: boolean) => {
    if (!open) {
      closeTahkirChrome();
      return;
    }
    setSidebarOpen(true);
  }, [closeTahkirChrome]);

  const setTimelineOpenExplicit = useCallback((open: boolean) => {
    setTimelineOpen(open);
    setActiveTool(t => (open ? 'timeline' : t === 'timeline' ? null : t));
  }, []);

  const setCreateOpenExplicit = useCallback((open: boolean) => {
    setCreateOpen(open);
    setActiveTool(t => {
      if (open) return 'create';
      return t === 'create' ? null : t;
    });
  }, []);

  const setSpaceActiveExplicit = useCallback((active: boolean) => {
    setActiveTool(active ? 'space' : null);
    if (active) setCreateOpen(false);
  }, []);

  const setTahkirLayerPanelOpen = useCallback((open: boolean) => {
    setTahkirLayerOpen(open);
  }, []);

  const spaceActive = activeTool === 'space';

  return (
    <TahkirUiContext.Provider
      value={{
        sidebarOpen,
        timelineOpen,
        createOpen,
        tahkirLayerOpen,
        spaceActive,
        activeTool,
        toggleSidebar,
        toggleTimeline,
        toggleCreate,
        closeCreate,
        toggleSpace,
        toggleTahkirLayer,
        closeTahkirChrome,
        setSidebarOpen: setSidebarOpenExplicit,
        setTimelineOpen: setTimelineOpenExplicit,
        setCreateOpen: setCreateOpenExplicit,
        setSpaceActive: setSpaceActiveExplicit,
        setTahkirLayerPanelOpen,
      }}
    >
      {children}
    </TahkirUiContext.Provider>
  );
}

export function useTahkirUi(): TahkirUiContextValue {
  const ctx = useContext(TahkirUiContext);
  if (!ctx) throw new Error('useTahkirUi must be used within TahkirUiProvider');
  return ctx;
}
