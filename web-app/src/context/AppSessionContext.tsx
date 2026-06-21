import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AppSession, UnitId } from '../types/session';
import { getPersonaAllowedUnits, getPersonaRolesForUnit } from '../types/session';
import type { RoleCategory, RoleId } from '../types/roles';
import { ROLE_CATEGORIES, getRoleCategory } from '../types/roles';
import { DEFAULT_USER_ID } from '../data/catalog/users';
import { isUnitId, personaAllowsUnit, resolvePersonaUnitId } from '../data/catalog/units';
import { getRepresentativeRole } from '../utils/resolveSidebarUi';
import { getPersona } from '../utils/roleUnitMenu';

const CURRENT_USER_KEY = 'app-current-user-id';
const SESSION_STORAGE_KEY = (uid: string) => `app-session-v2-${uid}`;

interface PersistedSession {
  activeEffort: RoleCategory | null;
  unitId: UnitId;
  studyOption: 1 | 2;
}

function loadSession(userId: string): PersistedSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY(userId));
    return raw ? (JSON.parse(raw) as PersistedSession) : null;
  } catch {
    return null;
  }
}

function saveSession(userId: string, session: AppSession): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY(userId), JSON.stringify({
      activeEffort: session.activeEffort,
      unitId: session.unitId,
      studyOption: session.studyOption,
    } satisfies PersistedSession));
  } catch {}
}

function effortFromRole(roleId: RoleId | null | undefined): RoleCategory | null {
  if (!roleId) return null;
  return getRoleCategory(roleId);
}

function validateEffort(
  effort: RoleCategory | null | undefined,
  allowedRoleIds: RoleId[],
): RoleCategory | null {
  if (!effort) return null;
  const cat = ROLE_CATEGORIES.find(c => c.id === effort);
  if (!cat) return null;
  const hasAny = cat.roles.some(r => allowedRoleIds.includes(r.id));
  return hasAny ? effort : null;
}

function buildSession(userId: string): AppSession {
  const persona = getPersona(userId);
  const persisted = loadSession(userId);
  const allowedUnitIds = getPersonaAllowedUnits(persona);

  const unitId = resolvePersonaUnitId(
    allowedUnitIds,
    persona.defaultUnitId,
    persisted?.unitId && isUnitId(persisted.unitId) ? persisted.unitId : undefined,
  );

  const allowedRoleIds = getPersonaRolesForUnit(persona, unitId);

  const persistedEffort = persisted?.activeEffort ??
    effortFromRole(allowedRoleIds.find(id => id !== 'guest') ?? null);

  const activeEffort = validateEffort(persistedEffort, allowedRoleIds);
  const activeRoleId = getRepresentativeRole(activeEffort, allowedRoleIds);

  return { userId, activeEffort, activeRoleId, allowedRoleIds, unitId, studyOption: persisted?.studyOption ?? 1 };
}

interface AppSessionContextValue {
  session: AppSession;
  switchUser: (userId: string) => void;
  setActiveEffort: (effort: RoleCategory | null) => void;
  setActiveRole: (roleId: RoleId | null) => void;
  setUnit: (unitId: UnitId) => void;
  setStudyOption: (option: 1 | 2) => void;
}

const AppSessionContext = createContext<AppSessionContextValue | null>(null);

export function AppSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AppSession>(() => {
    const userId = localStorage.getItem(CURRENT_USER_KEY) ?? DEFAULT_USER_ID;
    return buildSession(userId);
  });

  useEffect(() => {
    saveSession(session.userId, session);
  }, [session]);

  const switchUser = useCallback((userId: string) => {
    saveSession(session.userId, session);
    localStorage.setItem(CURRENT_USER_KEY, userId);
    setSession(buildSession(userId));
  }, [session]);

  const setActiveEffort = useCallback((effort: RoleCategory | null) => {
    const persona = getPersona(session.userId);
    const allowedRoleIds = getPersonaRolesForUnit(persona, session.unitId);
    const validated = effort ? validateEffort(effort, allowedRoleIds) : null;
    const repRole = getRepresentativeRole(validated, allowedRoleIds);
    setSession(s => ({ ...s, activeEffort: validated, activeRoleId: repRole }));
  }, [session.userId, session.unitId]);

  const setActiveRole = useCallback((roleId: RoleId | null) => {
    const effort = effortFromRole(roleId);
    const persona = getPersona(session.userId);
    const allowedRoleIds = getPersonaRolesForUnit(persona, session.unitId);
    const validated = effort ? validateEffort(effort, allowedRoleIds) : null;
    const repRole = getRepresentativeRole(validated, allowedRoleIds);
    setSession(s => ({ ...s, activeEffort: validated, activeRoleId: repRole }));
  }, [session.userId, session.unitId]);

  const setUnit = useCallback((unitId: UnitId) => {
    const persona = getPersona(session.userId);
    const allowedUnitIds = getPersonaAllowedUnits(persona);
    if (!isUnitId(unitId) || !personaAllowsUnit(allowedUnitIds, unitId)) return;
    const allowedRoleIds = getPersonaRolesForUnit(persona, unitId);
    const activeEffort = validateEffort(session.activeEffort, allowedRoleIds);
    const activeRoleId = getRepresentativeRole(activeEffort, allowedRoleIds);
    setSession(s => ({ ...s, unitId, allowedRoleIds, activeEffort, activeRoleId }));
  }, [session.userId, session.activeEffort]);

  const setStudyOption = useCallback((option: 1 | 2) => {
    setSession(s => ({ ...s, studyOption: option }));
  }, []);

  return (
    <AppSessionContext.Provider value={{ session, switchUser, setActiveEffort, setActiveRole, setUnit, setStudyOption }}>
      {children}
    </AppSessionContext.Provider>
  );
}

export function useAppSession() {
  const ctx = useContext(AppSessionContext);
  if (!ctx) throw new Error('useAppSession must be used inside AppSessionProvider');
  return ctx;
}
