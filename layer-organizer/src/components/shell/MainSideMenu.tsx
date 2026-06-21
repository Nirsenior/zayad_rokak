import { useEffect, useMemo, useState } from 'react';
import { figmaAssets } from '../../assets/figmaAssets';
import { useAppSession } from '../../context/AppSessionContext';
import { TIKSHUV_DEFAULT_ACTIVE } from '../../data/rules/tikshuvSidebar';
import { getUnit } from '../../data/catalog/units';
import type { SidebarNavItemId } from '../../types/sidebarUi';
import { resolveSidebarUi } from '../../utils/resolveSidebarUi';
import { SideMenuRoleSection } from './sidebar/SideMenuRoleSection';
import { SideMenuSharedSection } from './sidebar/SideMenuSharedSection';

const W = 57;

type Props = {
  onNavChange?: (id: SidebarNavItemId | null) => void;
};

/** סרגל ימני — חלק עליון לפי מאמץ/תפקיד, תחתון משותף (Figma 719:27607) */
export function MainSideMenu({ onNavChange }: Props) {
  const { session } = useAppSession();
  const [activeNavId, setActiveNavId] = useState<SidebarNavItemId | null>(null);

  const allowedRoleIds = session.allowedRoleIds;
  const unitLevel = getUnit(session.unitId).level;

  useEffect(() => {
    const next = session.activeEffort === 'tikshuv' ? TIKSHUV_DEFAULT_ACTIVE : null;
    setActiveNavId(next);
    onNavChange?.(next);
  }, [session.activeEffort]); // eslint-disable-line react-hooks/exhaustive-deps

  const sidebar = useMemo(
    () => resolveSidebarUi(session.activeEffort, allowedRoleIds, unitLevel, activeNavId),
    [session.activeEffort, allowedRoleIds, unitLevel, activeNavId],
  );

  const handleNavClick = (id: SidebarNavItemId) => {
    setActiveNavId(id);
    onNavChange?.(id);
  };

  return (
    <nav
      aria-label="תפריט ראשי"
      style={{
        position: 'relative',
        width: W,
        height: '100%',
        flexShrink: 0,
        fontFamily: 'var(--ds-font)',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-0.39%',
          right: '-3.51%',
          bottom: '-0.39%',
          left: '-10.53%',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <img
          src={figmaAssets.sidebarRailBg}
          alt=""
          style={{ display: 'block', width: '100%', height: '100%' }}
        />
      </div>

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <SideMenuRoleSection
            effortLabel={sidebar.effortLabel}
            effortItems={sidebar.effortNavItems}
            roleItems={sidebar.roleNavItems}
            onNavClick={handleNavClick}
          />
        </div>

        <SideMenuSharedSection
          navItems={sidebar.sharedBottomNav}
          compositeIds={sidebar.sharedBottom}
        />
      </div>
    </nav>
  );
}
