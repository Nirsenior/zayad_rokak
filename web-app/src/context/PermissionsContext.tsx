import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { TestPersona } from '../types/session';
import { loadPersonas, savePersonas } from '../utils/personasStorage';

export type PermissionsPanelMode = 'closed' | 'full' | 'minimized';

interface PermissionsContextValue {
  personas: TestPersona[];
  panelMode: PermissionsPanelMode;
  openPanel: () => void;
  minimizePanel: () => void;
  closePanel: () => void;
  setPersonas: (personas: TestPersona[]) => void;
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [personas, setPersonasState] = useState<TestPersona[]>(() => loadPersonas());
  const [panelMode, setPanelMode] = useState<PermissionsPanelMode>('closed');

  const setPersonas = useCallback((next: TestPersona[]) => {
    setPersonasState(next);
    savePersonas(next);
  }, []);

  const openPanel = useCallback(() => setPanelMode('full'), []);
  const minimizePanel = useCallback(() => setPanelMode('minimized'), []);
  const closePanel = useCallback(() => setPanelMode('closed'), []);

  // סנכרון ראשוני — אם localStorage עודכן מחוץ לקונטקסט
  useEffect(() => {
    setPersonasState(loadPersonas());
  }, []);

  return (
    <PermissionsContext.Provider value={{ personas, panelMode, openPanel, minimizePanel, closePanel, setPersonas }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const ctx = useContext(PermissionsContext);
  if (!ctx) throw new Error('usePermissions must be used inside PermissionsProvider');
  return ctx;
}
