import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { PlanningEditTarget } from '../data/rules/planningEditEntities';
import {
  TUTORIAL_PLAN_SUBFOLDER_ID,
  TUTORIAL_PLANNING_LAYER_IDS,
  TUTORIAL_SHTAKH_LAYER_ID,
  TUTORIAL_TOPICS,
  getTopicById,
} from '../tutorial/content';
import {
  TUTORIAL_DEMO_ROLE_ID,
  TUTORIAL_DEMO_USER_ID,
} from '../tutorial/mainSettingsTopic';
import {
  TUTORIAL_OREF_ROLE_ID,
  TUTORIAL_OREF_USER_ID,
} from '../tutorial/organizerTopic';
import type { TutorialPrepare } from '../tutorial/types';
import type { RoleId } from '../types/roles';

export interface TutorialShellBridge {
  setOrganizerOpen: (open: boolean) => void;
  setMainSidebarOpen: (open: boolean) => void;
  setOrganizerMode: (mode: 'nihuk' | 'tikhnun') => void;
  ensurePlanningLayerInOrganizer: (layerId: string) => void;
  expandPlanningPlan: (subFolderId: string) => void;
  openPlanningEdit: (target: PlanningEditTarget) => void;
  closePlanningEdit: () => void;
  closeTahkirChrome: () => void;
  setTahkirSidebarOpen: (open: boolean) => void;
  setTahkirTimelineOpen: (open: boolean) => void;
  setTahkirCreateOpen: (open: boolean) => void;
  setTahkirSpaceActive: (active: boolean) => void;
  /** משתמש + תפקיד לדמו בהדרכה (סיידבר אג"ם) */
  setSessionForDemo: (userId: string, roleId: RoleId) => void;
  expandOrganizerFolder: (mainFolderId: string, subFolderId?: string) => void;
  openNihukModal: (subFolderId?: string) => void;
  closeNihukModal: () => void;
  resetNihukToDefault: (subFolderId?: string) => void;
  getSessionSnapshot: () => { userId: string; roleId: RoleId | null };
}

export interface TutorialChromeBridge {
  openUserSettings: () => void;
  closeUserSettings: () => void;
  openMissionPlan: () => void;
  closeMissionPlan: () => void;
}

export type TutorialView = 'home' | 'lesson';

interface TutorialContextValue {
  isOpen: boolean;
  view: TutorialView;
  spotlightPaused: boolean;
  activeTopicId: string;
  stepIndex: number;
  toggleOpen: () => void;
  close: () => void;
  openHome: () => void;
  startTopic: (topicId: string) => void;
  finishLesson: () => void;
  selectTopic: (topicId: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  pauseSpotlight: () => void;
  registerShellBridge: (bridge: TutorialShellBridge | null) => void;
  registerUserSettingsChrome: (handlers: UserSettingsChromeHandlers | null) => void;
  registerMissionPlanChrome: (handlers: MissionPlanChromeHandlers | null) => void;
}

export type UserSettingsChromeHandlers = {
  open: () => void;
  close: () => void;
};

export type MissionPlanChromeHandlers = {
  open: () => void;
  close: () => void;
};

const TutorialContext = createContext<TutorialContextValue | null>(null);

const DEFAULT_TOPIC_ID = TUTORIAL_TOPICS[0]?.id ?? 'advanced-planning';

/** שמירת משתמש/תפקיד לפני דמו בהדרכה (applyPrepare מחוץ ל-Provider) */
const tutorialSessionRestoreRef: { current: { userId: string; roleId: RoleId } | null } = {
  current: null,
};

function planningEditTarget(
  suffix: 'shtakh' | 'oyev' | 'mivtzaim',
  layerId: string,
  layerName: string,
): PlanningEditTarget {
  return {
    layerId,
    layerName,
    planName: 'תוכנית שמש אדומה / 7020',
    suffix,
  };
}

function applyOrganizerBase(shell: TutorialShellBridge, chrome: TutorialChromeBridge | null) {
  chrome?.closeUserSettings();
  chrome?.closeMissionPlan();
  shell.closePlanningEdit();
  shell.closeTahkirChrome();
  shell.closeNihukModal();
}

function applyMainSettingsBase(
  shell: TutorialShellBridge,
  chrome: TutorialChromeBridge | null,
) {
  chrome?.closeUserSettings();
  chrome?.closeMissionPlan();
  shell.closePlanningEdit();
  shell.setOrganizerOpen(false);
  shell.closeTahkirChrome();
  shell.setMainSidebarOpen(true);
}

function applyPrepare(
  prepare: TutorialPrepare | undefined,
  shell: TutorialShellBridge | null,
  chrome: TutorialChromeBridge | null,
) {
  if (!shell || !prepare || prepare === 'none') return;

  switch (prepare) {
    case 'main-settings-base':
      applyMainSettingsBase(shell, chrome);
      break;
    case 'open-user-settings':
      applyMainSettingsBase(shell, chrome);
      chrome?.openUserSettings();
      break;
    case 'open-mission-plan':
      applyMainSettingsBase(shell, chrome);
      chrome?.closeUserSettings();
      chrome?.openMissionPlan();
      break;
    case 'demo-agam-system-admin':
      applyMainSettingsBase(shell, chrome);
      shell.setSessionForDemo(TUTORIAL_DEMO_USER_ID, TUTORIAL_DEMO_ROLE_ID);
      break;
    case 'open-organizer':
      shell.setOrganizerOpen(true);
      break;
    case 'planning-mode':
      shell.closeTahkirChrome();
      shell.setOrganizerOpen(true);
      shell.setOrganizerMode('tikhnun');
      shell.expandPlanningPlan(TUTORIAL_PLAN_SUBFOLDER_ID);
      for (const layerId of TUTORIAL_PLANNING_LAYER_IDS) {
        shell.ensurePlanningLayerInOrganizer(layerId);
      }
      break;
    case 'shtakh-layer-visible':
      shell.closeTahkirChrome();
      shell.setOrganizerOpen(true);
      shell.setOrganizerMode('tikhnun');
      shell.expandPlanningPlan(TUTORIAL_PLAN_SUBFOLDER_ID);
      shell.ensurePlanningLayerInOrganizer(TUTORIAL_SHTAKH_LAYER_ID);
      break;
    case 'open-shtakh-edit':
      shell.closeTahkirChrome();
      shell.setOrganizerOpen(true);
      shell.setOrganizerMode('tikhnun');
      shell.expandPlanningPlan(TUTORIAL_PLAN_SUBFOLDER_ID);
      shell.ensurePlanningLayerInOrganizer(TUTORIAL_SHTAKH_LAYER_ID);
      shell.openPlanningEdit(
        planningEditTarget('shtakh', TUTORIAL_SHTAKH_LAYER_ID, 'תכנון שטח'),
      );
      break;
    case 'open-oyev-edit':
      shell.closeTahkirChrome();
      shell.setOrganizerOpen(true);
      shell.setOrganizerMode('tikhnun');
      shell.expandPlanningPlan(TUTORIAL_PLAN_SUBFOLDER_ID);
      shell.openPlanningEdit(
        planningEditTarget('oyev', 'tk-sa7020-oyev', 'תכנון אויב'),
      );
      break;
    case 'open-mivtzaim-edit':
      shell.closeTahkirChrome();
      shell.setOrganizerOpen(true);
      shell.setOrganizerMode('tikhnun');
      shell.expandPlanningPlan(TUTORIAL_PLAN_SUBFOLDER_ID);
      shell.openPlanningEdit(
        planningEditTarget('mivtzaim', 'tk-sa7020-mivtzaim', 'תכנון מבצעים ראשי'),
      );
      break;
    case 'tahkir-reset':
      shell.closePlanningEdit();
      shell.setOrganizerOpen(false);
      shell.closeTahkirChrome();
      shell.setMainSidebarOpen(true);
      break;
    case 'tahkir-sidebar-open':
      shell.closePlanningEdit();
      shell.setOrganizerOpen(false);
      shell.setMainSidebarOpen(true);
      shell.setTahkirSidebarOpen(true);
      shell.setTahkirTimelineOpen(false);
      shell.setTahkirCreateOpen(false);
      shell.setTahkirSpaceActive(false);
      break;
    case 'tahkir-sidebar-with-tools':
      shell.closePlanningEdit();
      shell.setOrganizerOpen(false);
      shell.setMainSidebarOpen(true);
      shell.setTahkirSidebarOpen(true);
      shell.setTahkirTimelineOpen(false);
      shell.setTahkirCreateOpen(false);
      shell.setTahkirSpaceActive(false);
      break;
    case 'tahkir-timeline-open':
      shell.closePlanningEdit();
      shell.setOrganizerOpen(false);
      shell.setMainSidebarOpen(true);
      shell.setTahkirSidebarOpen(true);
      shell.setTahkirTimelineOpen(true);
      shell.setTahkirCreateOpen(false);
      shell.setTahkirSpaceActive(false);
      break;
    case 'tahkir-create-open':
      shell.closePlanningEdit();
      shell.setOrganizerOpen(false);
      shell.setMainSidebarOpen(true);
      shell.setTahkirSidebarOpen(true);
      shell.setTahkirTimelineOpen(false);
      shell.setTahkirCreateOpen(true);
      shell.setTahkirSpaceActive(false);
      break;
    case 'tahkir-space-active':
      shell.closePlanningEdit();
      shell.setOrganizerOpen(false);
      shell.setMainSidebarOpen(true);
      shell.setTahkirSidebarOpen(true);
      shell.setTahkirTimelineOpen(false);
      shell.setTahkirCreateOpen(false);
      shell.setTahkirSpaceActive(true);
      break;
    case 'organizer-close':
      applyOrganizerBase(shell, chrome);
      shell.setOrganizerOpen(false);
      break;
    case 'organizer-open-nihuk':
      applyOrganizerBase(shell, chrome);
      shell.setOrganizerOpen(true);
      shell.setOrganizerMode('nihuk');
      shell.expandOrganizerFolder('nihuk');
      break;
    case 'organizer-open-tikhnun':
      applyOrganizerBase(shell, chrome);
      shell.setOrganizerOpen(true);
      shell.expandOrganizerFolder('tikhnun', TUTORIAL_PLAN_SUBFOLDER_ID);
      break;
    case 'organizer-restore-session-open-tikhnun': {
      const saved = tutorialSessionRestoreRef.current;
      if (saved) {
        shell.setSessionForDemo(saved.userId, saved.roleId);
        tutorialSessionRestoreRef.current = null;
      }
      applyOrganizerBase(shell, chrome);
      shell.setOrganizerOpen(true);
      shell.expandOrganizerFolder('tikhnun', TUTORIAL_PLAN_SUBFOLDER_ID);
      break;
    }
    case 'organizer-layer-lock-demo':
      applyOrganizerBase(shell, chrome);
      shell.setOrganizerOpen(true);
      shell.setOrganizerMode('nihuk');
      shell.expandOrganizerFolder('tikhnun', TUTORIAL_PLAN_SUBFOLDER_ID);
      shell.ensurePlanningLayerInOrganizer(TUTORIAL_SHTAKH_LAYER_ID);
      break;
    case 'organizer-open-plugot':
      applyOrganizerBase(shell, chrome);
      shell.setOrganizerOpen(true);
      shell.setOrganizerMode('nihuk');
      shell.expandOrganizerFolder('marshme-plugot');
      break;
    case 'organizer-modal-mivtzaim':
      applyOrganizerBase(shell, chrome);
      shell.setOrganizerOpen(true);
      shell.setOrganizerMode('nihuk');
      shell.expandOrganizerFolder('nihuk', 'mivtzaim');
      shell.openNihukModal('mivtzaim');
      break;
    case 'organizer-role-oref': {
      const snap = shell.getSessionSnapshot();
      if (!tutorialSessionRestoreRef.current && snap.roleId) {
        tutorialSessionRestoreRef.current = {
          userId: snap.userId,
          roleId: snap.roleId,
        };
      }
      applyOrganizerBase(shell, chrome);
      shell.setSessionForDemo(TUTORIAL_OREF_USER_ID, TUTORIAL_OREF_ROLE_ID);
      shell.setOrganizerOpen(true);
      shell.setOrganizerMode('nihuk');
      shell.expandOrganizerFolder('nihuk');
      shell.resetNihukToDefault();
      break;
    }
    case 'organizer-nihuk-lakhima':
    case 'organizer-nihuk-siyuta': {
      const subId = prepare.replace('organizer-nihuk-', '');
      applyOrganizerBase(shell, chrome);
      shell.setOrganizerOpen(true);
      shell.setOrganizerMode('nihuk');
      shell.expandOrganizerFolder('nihuk', subId);
      break;
    }
    default:
      break;
  }
}

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<TutorialView>('home');
  const [spotlightPaused, setSpotlightPaused] = useState(false);
  const [activeTopicId, setActiveTopicId] = useState(DEFAULT_TOPIC_ID);
  const [stepIndex, setStepIndex] = useState(0);
  const bridgeRef = useRef<TutorialShellBridge | null>(null);
  const userSettingsChromeRef = useRef<UserSettingsChromeHandlers | null>(null);
  const missionPlanChromeRef = useRef<MissionPlanChromeHandlers | null>(null);

  const getChromeBridge = useCallback((): TutorialChromeBridge | null => {
    const user = userSettingsChromeRef.current;
    const mission = missionPlanChromeRef.current;
    if (!user && !mission) return null;
    return {
      openUserSettings: () => user?.open(),
      closeUserSettings: () => user?.close(),
      openMissionPlan: () => mission?.open(),
      closeMissionPlan: () => mission?.close(),
    };
  }, []);

  const topic = getTopicById(activeTopicId) ?? TUTORIAL_TOPICS[0];
  const stepCount = topic?.steps.length ?? 0;
  const currentStep = topic?.steps[stepIndex];

  const registerShellBridge = useCallback((bridge: TutorialShellBridge | null) => {
    bridgeRef.current = bridge;
  }, []);

  const registerUserSettingsChrome = useCallback(
    (handlers: UserSettingsChromeHandlers | null) => {
      userSettingsChromeRef.current = handlers;
    },
    [],
  );

  const registerMissionPlanChrome = useCallback(
    (handlers: MissionPlanChromeHandlers | null) => {
      missionPlanChromeRef.current = handlers;
    },
    [],
  );

  const resumeSpotlight = useCallback(() => {
    setSpotlightPaused(false);
  }, []);

  const exitLessonEffects = useCallback(() => {
    setSpotlightPaused(false);
    const chrome = getChromeBridge();
    chrome?.closeUserSettings();
    chrome?.closeMissionPlan();
    const saved = tutorialSessionRestoreRef.current;
    if (saved && bridgeRef.current) {
      bridgeRef.current.setSessionForDemo(saved.userId, saved.roleId);
      tutorialSessionRestoreRef.current = null;
    }
    bridgeRef.current?.closePlanningEdit();
    bridgeRef.current?.closeNihukModal();
    bridgeRef.current?.closeTahkirChrome();
  }, [getChromeBridge]);

  useEffect(() => {
    if (!isOpen || view !== 'lesson' || !currentStep) return;
    applyPrepare(currentStep.prepare ?? 'none', bridgeRef.current, getChromeBridge());
    resumeSpotlight();
  }, [isOpen, view, activeTopicId, stepIndex, currentStep?.id, resumeSpotlight, getChromeBridge]);

  const openHome = useCallback(() => {
    exitLessonEffects();
    setView('home');
    setIsOpen(true);
  }, [exitLessonEffects]);

  const toggleOpen = useCallback(() => {
    setIsOpen(o => {
      if (!o) {
        setView('home');
        setSpotlightPaused(false);
        return true;
      }
      exitLessonEffects();
      return false;
    });
  }, [exitLessonEffects]);

  const close = useCallback(() => {
    exitLessonEffects();
    setIsOpen(false);
    setView('home');
  }, [exitLessonEffects]);

  const startTopic = useCallback((topicId: string) => {
    if (!getTopicById(topicId)) return;
    setActiveTopicId(topicId);
    setStepIndex(0);
    setSpotlightPaused(false);
    setView('lesson');
    setIsOpen(true);
  }, []);

  const finishLesson = useCallback(() => {
    exitLessonEffects();
    setView('home');
    setIsOpen(true);
  }, [exitLessonEffects]);

  const selectTopic = useCallback((topicId: string) => {
    if (!getTopicById(topicId)) return;
    setActiveTopicId(topicId);
    setStepIndex(0);
    setSpotlightPaused(false);
    setView('lesson');
  }, []);

  const nextStep = useCallback(() => {
    setStepIndex(i => Math.min(i + 1, stepCount - 1));
    setSpotlightPaused(false);
  }, [stepCount]);

  const prevStep = useCallback(() => {
    setStepIndex(i => Math.max(i - 1, 0));
    setSpotlightPaused(false);
  }, []);

  const pauseSpotlight = useCallback(() => {
    setSpotlightPaused(true);
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      view,
      spotlightPaused,
      activeTopicId,
      stepIndex,
      toggleOpen,
      close,
      openHome,
      startTopic,
      finishLesson,
      selectTopic,
      nextStep,
      prevStep,
      pauseSpotlight,
      registerShellBridge,
      registerUserSettingsChrome,
      registerMissionPlanChrome,
    }),
    [
      isOpen,
      view,
      spotlightPaused,
      activeTopicId,
      stepIndex,
      toggleOpen,
      close,
      openHome,
      startTopic,
      finishLesson,
      selectTopic,
      nextStep,
      prevStep,
      pauseSpotlight,
      registerShellBridge,
      registerUserSettingsChrome,
      registerMissionPlanChrome,
    ],
  );

  return <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>;
}

export function useTutorial() {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error('useTutorial must be used within TutorialProvider');
  return ctx;
}

export function useTutorialState() {
  return useContext(TutorialContext);
}
