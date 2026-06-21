import { useLayerOrganizer } from '../context/LayerOrganizerContext';
import { Header } from './Header';
import { MainFolderSection } from './MainFolderSection';

export function LayerOrganizer() {
  const { state } = useLayerOrganizer();

  return (
    <div
      data-tutorial-id="organizer-panel"
      style={{
        position: 'relative',
        width: 'var(--ds-organizer-width)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--ds-organizer-surface)',
        fontFamily: 'var(--ds-font)',
        direction: 'rtl',
        color: 'var(--ds-text-primary)',
        boxShadow: 'var(--ds-shadow-panel)',
        borderLeft: '1px solid var(--ds-organizer-border)',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <Header />

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', background: 'var(--ds-organizer-content)' }}>
        {state.mainFolders.map(folder => (
          <MainFolderSection key={folder.id} folder={folder} />
        ))}
      </div>
    </div>
  );
}
