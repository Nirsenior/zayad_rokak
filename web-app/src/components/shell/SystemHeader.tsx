import { HeaderUserButton } from './HeaderUserButton';
import { HeaderSearchButton } from './HeaderSearchButton';
import { HeaderDateTime } from './HeaderDateTime';
import { MissionPlanButton } from './MissionPlanButton';
import { SidebarToggleButton } from './SidebarToggleButton';
import { Icon28 } from './Icon28';
import { figmaAssets } from '../../assets/figmaAssets';
import { useTutorial } from '../../context/TutorialContext';

const H = 38;

type Props = {
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
  ganttOpen?: boolean;
  onGanttToggle?: () => void;
};

/** כותרת — מיקומי px מ-Figma על קנבס 1920 */
export function SystemHeader({ sidebarOpen, onSidebarToggle, ganttOpen = false, onGanttToggle }: Props) {
  const { toggleOpen, isOpen } = useTutorial();

  return (
    <header
      style={{
        position: 'relative',
        width: '100%',
        height: H,
        zIndex: 200,
        fontFamily: 'var(--ds-font)',
      }}
    >
      <img
        src={figmaAssets.headerBg}
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'fill',
          pointerEvents: 'none',
        }}
      />

      {/* Mission Minilist — x=5 */}
      <button
        type="button"
        title="Mission Minilist"
        style={{
          position: 'absolute',
          left: 5,
          top: 0,
          width: 94,
          height: 38,
          border: 'none',
          background: 'transparent',
          cursor: 'default',
          padding: 0,
        }}
      >
        <img
          src={figmaAssets.missionMinilist}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block' }}
        />
      </button>

      <HeaderSearchButton />

      {/* אייקונים שמאל — 20×20, y=9 (ממורכז ב-38) */}
      <div style={{ position: 'absolute', left: 225, top: 9 }}>
        <WifiIcon />
      </div>
      <div style={{ position: 'absolute', left: 265, top: 9 }}>
        <NotificationIcon />
      </div>
      <div style={{ position: 'absolute', left: 307, top: 9 }}>
        <Icon28 src={figmaAssets.settingsIcon} alt="הגדרות" />
      </div>
      <button
        type="button"
        onClick={toggleOpen}
        title={isOpen ? 'סגור הדרכה' : 'פתח הדרכה'}
        aria-pressed={isOpen}
        aria-label="עזרה והדרכה"
        style={{
          position: 'absolute',
          left: 349,
          top: 5,
          width: 28,
          height: 28,
          padding: 0,
          border: 'none',
          background: isOpen ? 'rgba(167, 139, 250, 0.25)' : 'transparent',
          borderRadius: 4,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon28 src={figmaAssets.helpIcon} alt="" />
      </button>

      <HeaderDateTime />

      {/* User — Figma 719:27213, ממורכז, 307×46 */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          transform: 'translateX(-50%)',
          width: 307,
          height: H,
        }}
      >
        <HeaderUserButton />
      </div>

      {/* Layout + Applications + Mission Plan — Figma right:80 (moved to prevent overlap with SidebarToggleButton) */}
      <div
        style={{
          position: 'absolute',
          right: 80,
          top: 0,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          height: 38,
        }}
      >
        <button
          type="button"
          onClick={onGanttToggle}
          title={ganttOpen ? "סגור תצוגת גאנט" : "פתח תצוגת גאנט (חלוקת מסך)"}
          style={{
            width: 28,
            height: 28,
            marginTop: 5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            background: ganttOpen ? 'rgba(76, 138, 247, 0.18)' : 'transparent',
            border: ganttOpen ? '1px solid rgba(76, 138, 247, 0.5)' : 'none',
            borderRadius: 4,
            cursor: 'pointer',
            padding: 0,
            boxShadow: ganttOpen ? '0 0 8px rgba(76, 138, 247, 0.4)' : 'none',
            transition: 'all 0.15s ease',
            outline: 'none',
          }}
          onMouseEnter={(e) => {
            if (!ganttOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
          }}
          onMouseLeave={(e) => {
            if (!ganttOpen) e.currentTarget.style.background = 'transparent';
          }}
        >
          <img
            src={figmaAssets.layoutIcon}
            alt="Layout"
            width={20}
            height={17}
            style={{
              objectFit: 'contain',
              opacity: ganttOpen ? 1 : 0.85,
            }}
          />
        </button>
        <div style={{ marginTop: 5, flexShrink: 0 }}>
          <Icon28 src={figmaAssets.applicationsIcon} alt="Applications" />
        </div>
        <div style={{ flexShrink: 0 }}>
          <MissionPlanButton />
        </div>
      </div>

      {/* פתיחה/סגירה סיידבר — Figma 393:34619, right=20 */}
      <div style={{ position: 'absolute', right: 20, top: 4 }}>
        <SidebarToggleButton open={sidebarOpen} onClick={onSidebarToggle} />
      </div>
    </header>
  );
}

function WifiIcon() {
  return (
    <span style={{ display: 'block', width: 20, height: 20, position: 'relative' }}>
      <img
        src={figmaAssets.wifi1}
        alt=""
        style={{ position: 'absolute', left: 1, top: 3, width: 18, height: 6, objectFit: 'contain' }}
      />
      <img
        src={figmaAssets.wifi3}
        alt=""
        style={{ position: 'absolute', left: 4, top: 8, width: 12, height: 5, objectFit: 'contain' }}
      />
      <img
        src={figmaAssets.wifi2}
        alt=""
        style={{ position: 'absolute', left: 8, top: 13, width: 4, height: 4, objectFit: 'contain' }}
      />
    </span>
  );
}

function NotificationIcon() {
  return (
    <span style={{ display: 'block', width: 20, height: 20, position: 'relative' }}>
      <img
        src={figmaAssets.notificationBell}
        alt=""
        width={20}
        height={20}
        style={{ objectFit: 'contain', display: 'block' }}
      />
      <img
        src={figmaAssets.notificationDot}
        alt=""
        width={6}
        height={6}
        style={{ position: 'absolute', right: 2, top: 2, objectFit: 'contain' }}
      />
    </span>
  );
}
