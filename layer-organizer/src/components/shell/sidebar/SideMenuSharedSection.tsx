import type React from 'react';
import type { SidebarCompositeId, SidebarNavItemResolved } from '../../../types/sidebarUi';
import { useTahkirUi } from '../../../context/TahkirUiContext';
import { SideMenuAiButton } from './SideMenuAiButton';
import { SideMenuEcosystemTabItem } from './SideMenuEcosystemTabItem';
import { SideMenuNavItem } from './SideMenuNavItem';
import { SideMenuPkmbButton } from './SideMenuPkmbButton';

type Props = {
  navItems: SidebarNavItemResolved[];
  /** סדר מלמטה למעלה — האחרון ברשימה צמוד לתחתית הסרגל */
  compositeIds: SidebarCompositeId[];
};

function renderComposite(id: SidebarCompositeId) {
  switch (id) {
    case 'shell.sidebar.pkmb':
      return <SideMenuPkmbButton key={id} />;
    case 'shell.sidebar.ai':
      return <SideMenuAiButton key={id} />;
    default:
      return null;
  }
}

const LABEL_STYLE: React.CSSProperties = {
  margin: '0 0 6px',
  padding: '0 4px',
  fontFamily: 'var(--ds-font)',
  fontSize: 10,
  fontWeight: 600,
  lineHeight: 1.2,
  color: 'var(--ds-text-caption)',
  textAlign: 'center',
  opacity: 0.85,
};

/** חלק תחתון — כלים משותפים לכל המאמצים והתפקידים */
export function SideMenuSharedSection({ navItems, compositeIds }: Props) {
  const tahkir = useTahkirUi();

  return (
    <div
      data-tutorial-id="sidebar-bottom-section"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        flexShrink: 0,
        padding: '8px 4px 10px',
        borderTop: '1px solid rgba(255, 255, 255, 0.12)',
        boxSizing: 'border-box',
      }}
    >
      <p style={LABEL_STYLE}>כלים משותפים</p>
      {navItems.map(item => {
        if (item.variant === 'ecosystem') {
          const isTahkir = item.id === 'shell.sidebar.nav.item.tahkir';
          return (
            <SideMenuEcosystemTabItem
              key={item.id}
              item={{
                ...item,
                active: isTahkir ? tahkir.sidebarOpen : item.active,
              }}
              onClick={isTahkir ? tahkir.toggleSidebar : undefined}
              tutorialId={isTahkir ? 'sidebar-tahkir' : undefined}
            />
          );
        }
        return <SideMenuNavItem key={item.id} item={item} />;
      })}
      {compositeIds.map(id => renderComposite(id))}
    </div>
  );
}
