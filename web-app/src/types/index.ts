export * from './layers';
export * from './roles';
export * from './session';

/** @deprecated Use LayerOrganizerState */
export type OrganizerState = import('./layers').LayerOrganizerState & {
  selectedOption: 1 | 2;
  userType: import('./roles').RoleId | null;
  currentUserId: string;
};
