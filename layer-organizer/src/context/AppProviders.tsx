import type { ReactNode } from 'react';
import { AppSessionProvider } from './AppSessionContext';
import { LayerOrganizerProvider } from './LayerOrganizerContext';
import { TahkirUiProvider } from './TahkirUiContext';
import { TutorialProvider } from './TutorialContext';
import { PermissionsProvider } from './PermissionsContext';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <PermissionsProvider>
      <AppSessionProvider>
        <TutorialProvider>
          <LayerOrganizerProvider>
            <TahkirUiProvider>{children}</TahkirUiProvider>
          </LayerOrganizerProvider>
        </TutorialProvider>
      </AppSessionProvider>
    </PermissionsProvider>
  );
}
