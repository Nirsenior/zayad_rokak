import { useEffect, useState, useMemo, useCallback, type CSSProperties } from 'react';
import type { RoleId } from '../../types/roles';
import { useLayerOrganizer } from '../../context/LayerOrganizerContext';
import { useTutorial } from '../../context/TutorialContext';
import { TutorialHost } from '../tutorial/TutorialHost';
import { DesignCanvas } from './DesignCanvas';
import { SystemHeader } from './SystemHeader';
import { MapViewport } from './MapViewport';
import { MainSideMenu } from './MainSideMenu';
import { LayersToggle } from './LayersToggle';
import { TahkirLayersToggle } from './TahkirLayersToggle';
import { LayerOrganizer } from '../LayerOrganizer';
import { OptionSelector } from '../OptionSelector';
import { NihukModal } from '../NihukModal';
import { PlanningEditPanel } from '../PlanningEditPanel';
import { TahkirCreatePanel } from '../tahkir/TahkirCreatePanel';
import { TahkirParallelSideMenu } from '../tahkir/TahkirParallelSideMenu';
import { TahkirTimelineBar } from '../tahkir/TahkirTimelineBar';
import { MapExternalLinksDock } from './MapExternalLinksDock';
import { IctSecondarySidebar } from './IctSecondarySidebar';
import { PermissionsPanel } from './PermissionsPanel';
import { useTahkirUi } from '../../context/TahkirUiContext';
import { useAppSession } from '../../context/AppSessionContext';
import { usePermissions } from '../../context/PermissionsContext';
import { DESIGN_HEIGHT } from '../../hooks/useDesignScale';
import {
  HEADER_H,
  ICT_SECONDARY_SIDEBAR_W,
  MAIN_MENU_LEFT,
  MAIN_MENU_W,
  TAHKIR_CREATE_PANEL_W,
  TAHKIR_SIDEBAR_W,
  TAHKIR_TIMELINE_H,
  TAHKIR_TIMELINE_LEFT,
  ictSecondarySidebarLeft,
  layersToggleLeft,
  organizerAnchorRight,
  tahkirChromeRightInset,
  tahkirCreatePanelLeft,
  tahkirSidebarHeight,
  tahkirSidebarLeft,
  tahkirSidebarTop,
} from './shellLayout';
import type { SidebarNavItemId } from '../../types/sidebarUi';
import { ICT_SUB_NAV } from '../../data/rules/ictSubNav';

const LAYERS_TOP = 56;
const MAP_H = DESIGN_HEIGHT - HEADER_H;

const toolsColumnStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 9,
  alignItems: 'center',
  zIndex: 210,
};

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [organizerOpen, setOrganizerOpen] = useState(false);
  const [ictActiveNavId, setIctActiveNavId] = useState<SidebarNavItemId | null>(null);
  const ictSecondaryOpen =
    sidebarOpen && ictActiveNavId !== null && !!ICT_SUB_NAV[ictActiveNavId]?.length;
  const { panelMode: permissionsPanelMode, openPanel: openPermissions } = usePermissions();
  const {
    setOrganizerMode,
    expandPlanningPlan,
    ensurePlanningLayerInOrganizer,
    expandOrganizerFolder,
    openNihukModal,
    closeNihukModal,
    resetNihukToDefault,
    openPlanningEdit,
    closePlanningEdit,
  } = useLayerOrganizer();
  const { session, switchUser, setActiveRole } = useAppSession();
  const { registerShellBridge } = useTutorial();
  const {
    sidebarOpen: tahkirSidebarOpen,
    timelineOpen,
    createOpen,
    spaceActive,
    tahkirLayerOpen,
    toggleTahkirLayer,
    closeTahkirChrome,
    setSidebarOpen: setTahkirSidebarOpen,
    setTimelineOpen: setTahkirTimelineOpen,
    setCreateOpen: setTahkirCreateOpen,
    setSpaceActive: setTahkirSpaceActive,
  } = useTahkirUi();

  useEffect(() => {
    if (spaceActive) setOrganizerOpen(false);
  }, [spaceActive]);

  useEffect(() => {
    if (!sidebarOpen) closeTahkirChrome();
  }, [sidebarOpen, closeTahkirChrome]);

  const setSessionForDemo = useCallback(
    (userId: string, roleId: RoleId) => {
      if (session.userId !== userId) switchUser(userId);
      setActiveRole(roleId);
    },
    [session.userId, switchUser, setActiveRole],
  );

  const getSessionSnapshot = useCallback(
    () => ({
      userId: session.userId,
      roleId: session.activeRoleId,
    }),
    [session.userId, session.activeRoleId],
  );

  const shellBridge = useMemo(
    () => ({
      setOrganizerOpen,
      setMainSidebarOpen: setSidebarOpen,
      setOrganizerMode,
      expandPlanningPlan,
      ensurePlanningLayerInOrganizer,
      expandOrganizerFolder,
      openNihukModal,
      closeNihukModal,
      resetNihukToDefault,
      openPlanningEdit,
      closePlanningEdit,
      closeTahkirChrome,
      setTahkirSidebarOpen,
      setTahkirTimelineOpen,
      setTahkirCreateOpen,
      setTahkirSpaceActive,
      setSessionForDemo,
      getSessionSnapshot,
    }),
    [
      setOrganizerMode,
      expandPlanningPlan,
      ensurePlanningLayerInOrganizer,
      expandOrganizerFolder,
      openNihukModal,
      closeNihukModal,
      resetNihukToDefault,
      openPlanningEdit,
      closePlanningEdit,
      closeTahkirChrome,
      setTahkirSidebarOpen,
      setTahkirTimelineOpen,
      setTahkirCreateOpen,
      setTahkirSpaceActive,
      setSessionForDemo,
      getSessionSnapshot,
    ],
  );

  useEffect(() => {
    registerShellBridge(shellBridge);
    return () => registerShellBridge(null);
  }, [registerShellBridge, shellBridge]);

  const anchorRight = organizerAnchorRight(sidebarOpen, tahkirSidebarOpen, createOpen, ictSecondaryOpen);
  const toggleLeft = layersToggleLeft(sidebarOpen, tahkirSidebarOpen, createOpen, ictSecondaryOpen);
  const toggleTop = LAYERS_TOP - HEADER_H;
  const timelineWidth =
    1920 - TAHKIR_TIMELINE_LEFT - tahkirChromeRightInset(sidebarOpen, tahkirSidebarOpen, createOpen, ictSecondaryOpen);

  return (
    <DesignCanvas>
      <div style={{ width: 1920, height: DESIGN_HEIGHT, position: 'relative' }}>
        <SystemHeader
          sidebarOpen={sidebarOpen}
          onSidebarToggle={() => setSidebarOpen(o => !o)}
        />

        <div
          style={{
            position: 'absolute',
            top: HEADER_H,
            left: 0,
            width: 1920,
            height: MAP_H,
          }}
        >
          <MapViewport />
          <MapExternalLinksDock />

          {organizerOpen && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: anchorRight,
                height: MAP_H,
                display: 'flex',
                flexDirection: 'row',
                direction: 'ltr',
                alignItems: 'stretch',
                gap: 0,
                zIndex: 150,
                pointerEvents: 'none',
              }}
            >
              <div style={{ pointerEvents: 'auto' }}>
                <OptionSelector />
              </div>
              <div
                style={{
                  position: 'relative',
                  height: MAP_H,
                  pointerEvents: 'auto',
                }}
              >
                <LayerOrganizer />
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            ...toolsColumnStyle,
            position: 'absolute',
            left: toggleLeft,
            top: LAYERS_TOP,
            zIndex: 210,
          }}
        >
          <LayersToggle
            active={organizerOpen}
            disabled={spaceActive}
            onClick={() => {
              if (!spaceActive) setOrganizerOpen(o => !o);
            }}
          />
          {tahkirSidebarOpen && (
            <TahkirLayersToggle active={tahkirLayerOpen} onClick={toggleTahkirLayer} />
          )}
        </div>

        {createOpen && (
          <div
            data-tutorial-id="tahkir-create-panel"
            style={{
              position: 'absolute',
              left: tahkirCreatePanelLeft(),
              top: HEADER_H,
              width: TAHKIR_CREATE_PANEL_W,
              height: MAP_H,
              zIndex: 125,
            }}
          >
            <TahkirCreatePanel />
          </div>
        )}

        {tahkirSidebarOpen && (
          <div
            style={{
              position: 'absolute',
              left: tahkirSidebarLeft(),
              top: tahkirSidebarTop(),
              width: TAHKIR_SIDEBAR_W,
              height: tahkirSidebarHeight(DESIGN_HEIGHT),
              zIndex: 130,
            }}
          >
            <TahkirParallelSideMenu />
          </div>
        )}

        {sidebarOpen && ictSecondaryOpen && (
          <div
            style={{
              position: 'absolute',
              left: ictSecondarySidebarLeft(),
              top: HEADER_H,
              width: ICT_SECONDARY_SIDEBAR_W,
              height: DESIGN_HEIGHT - HEADER_H,
              zIndex: 118,
            }}
          >
            <IctSecondarySidebar activeNavId={ictActiveNavId} />
          </div>
        )}

        {sidebarOpen && (
          <div
            style={{
              position: 'absolute',
              left: MAIN_MENU_LEFT,
              top: HEADER_H,
              width: MAIN_MENU_W,
              height: DESIGN_HEIGHT - HEADER_H,
              zIndex: 120,
            }}
          >
            <MainSideMenu onNavChange={(id) => {
              if (id === 'shell.sidebar.nav.item.permissions') {
                openPermissions();
              } else {
                setIctActiveNavId(id);
              }
            }} />
          </div>
        )}

        {timelineOpen && (
          <div
            data-tutorial-id="tahkir-timeline-bar"
            style={{
              position: 'absolute',
              left: TAHKIR_TIMELINE_LEFT,
              bottom: 0,
              width: timelineWidth,
              height: TAHKIR_TIMELINE_H,
              zIndex: 140,
            }}
          >
            <TahkirTimelineBar width={timelineWidth} />
          </div>
        )}

        {(permissionsPanelMode === 'full' || permissionsPanelMode === 'minimized') && (
          <PermissionsPanel mode={permissionsPanelMode} />
        )}

        <NihukModal />
        <PlanningEditPanel organizerAnchorRight={anchorRight} />
        <TutorialHost />
      </div>
    </DesignCanvas>
  );
}
