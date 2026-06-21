export type TutorialTargetId =
  | 'header-user-button'
  | 'user-settings-user'
  | 'user-settings-unit'
  | 'mission-plan-button'
  | 'mission-plan-dropdown'
  | 'sidebar-effort-block'
  | 'sidebar-role-block'
  | 'sidebar-bottom-section'
  | 'layers-toggle'
  | 'organizer-planning-mode'
  | 'planning-layer-shtakh-edit'
  | 'planning-layer-oyev-edit'
  | 'planning-layer-mivtzaim-edit'
  | 'advanced-planning-shtakh'
  | 'advanced-planning-oyev'
  | 'advanced-planning-mivtzaim'
  | 'sidebar-tahkir'
  | 'tahkir-parallel-sidebar'
  | 'tahkir-layers-toggle'
  | 'tahkir-tool-timeline'
  | 'tahkir-tool-create'
  | 'tahkir-tool-space'
  | 'tahkir-timeline-bar'
  | 'tahkir-create-panel'
  | 'organizer-panel'
  | 'organizer-mode-switch'
  | 'organizer-global-edit'
  | 'organizer-global-add'
  | 'organizer-view-level'
  | 'organizer-global-labels'
  | 'organizer-global-eye'
  | 'organizer-global-dots'
  | 'organizer-folder-nihuk'
  | 'organizer-folder-tikhnun'
  | 'organizer-folder-plugot'
  | 'organizer-nihuk-filter'
  | 'organizer-nihuk-add'
  | 'organizer-add-modal'
  | 'organizer-sub-lakhima'
  | 'organizer-sub-siyuta'
  | 'organizer-layer-edit-lock';

export type TutorialPrepare =
  | 'none'
  | 'main-settings-base'
  | 'open-user-settings'
  | 'open-mission-plan'
  | 'demo-agam-system-admin'
  | 'open-organizer'
  | 'planning-mode'
  | 'shtakh-layer-visible'
  | 'open-shtakh-edit'
  | 'open-oyev-edit'
  | 'open-mivtzaim-edit'
  | 'tahkir-reset'
  | 'tahkir-sidebar-open'
  | 'tahkir-sidebar-with-tools'
  | 'tahkir-timeline-open'
  | 'tahkir-create-open'
  | 'tahkir-space-active'
  | 'organizer-close'
  | 'organizer-open-nihuk'
  | 'organizer-open-tikhnun'
  | 'organizer-open-plugot'
  | 'organizer-modal-mivtzaim'
  | 'organizer-role-oref'
  | 'organizer-restore-session-open-tikhnun'
  | 'organizer-layer-lock-demo'
  | 'organizer-nihuk-lakhima'
  | 'organizer-nihuk-siyuta';

/** קטע טקסט בהדרכה — כפתור AI / שם מרשם / טקסט רגיל */
export type TutorialBodyPart =
  | string
  | { kind: 'planning-btn'; label: string }
  | { kind: 'layer'; label: string };

export interface TutorialStep {
  id: string;
  title: string;
  bodyParts?: TutorialBodyPart[];
  targetId?: TutorialTargetId;
  targetIds?: TutorialTargetId[];
  prepare?: TutorialPrepare;
}

export interface TutorialTopic {
  id: string;
  label: string;
  steps: TutorialStep[];
}
