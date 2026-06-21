import { figmaAssets } from '../../assets/figmaAssets';
import { useTahkirUi } from '../../context/TahkirUiContext';

const BTN = 40;

function TabIcon({ src }: { src: string }) {
  return (
    <div style={{ width: 18, height: 18, overflow: 'hidden', flexShrink: 0 }}>
      <img src={src} alt="" style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}

type ToolButtonProps = {
  label: string;
  icon: string;
  active: boolean;
  title?: string;
  tutorialId?: string;
  onClick: () => void;
};

function ToolButton({ label, icon, active, title, tutorialId, onClick }: ToolButtonProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <button
        type="button"
        data-tutorial-id={tutorialId}
        title={title ?? label}
        onClick={onClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: BTN,
          height: BTN,
          padding: 0,
          border: 'none',
          borderRadius: 6,
          background: active ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
          cursor: 'pointer',
          boxSizing: 'border-box',
        }}
      >
        <TabIcon src={icon} />
      </button>
      <p
        style={{
          margin: '2px 0 0',
          fontFamily: 'Assistant, var(--ds-font)',
          fontWeight: 400,
          fontSize: 12,
          lineHeight: '16px',
          letterSpacing: '0.04px',
          color: '#eee',
          textAlign: 'center',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </p>
    </div>
  );
}

/** סיידבר תחקור מקביל — Figma 393:37071 */
export function TahkirParallelSideMenu() {
  const { activeTool, toggleSidebar, toggleTimeline, toggleCreate, toggleSpace } = useTahkirUi();

  return (
    <aside
      aria-label="תחקור"
      data-tutorial-id="tahkir-parallel-sidebar"
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        background: 'rgba(20, 21, 26, 0.9)',
        backdropFilter: 'blur(2.2px)',
        WebkitBackdropFilter: 'blur(2.2px)',
        boxShadow: '0 1.25px 12.5px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8px 10px 12px',
        fontFamily: 'var(--ds-font)',
      }}
    >
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label="קפל סיידבר תחקור"
        title="קפל"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: BTN,
          height: BTN,
          marginBottom: 8,
          padding: 0,
          border: 'none',
          borderRadius: 6,
          background: 'rgba(255, 255, 255, 0.08)',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <img
          src={figmaAssets.sidebarToggleChevron}
          alt=""
          width={14}
          height={14}
          style={{ transform: 'rotate(-90deg)', display: 'block' }}
        />
      </button>

      <h2
        style={{
          margin: '0 0 12px',
          fontFamily: 'Assistant, var(--ds-font)',
          fontWeight: 700,
          fontSize: 18,
          lineHeight: '20px',
          letterSpacing: '-0.04px',
          color: '#eee',
          textAlign: 'center',
        }}
      >
        תחקור
      </h2>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          width: '100%',
        }}
      >
        <ToolButton
          label="ציר זמן"
          icon={figmaAssets.tahkirTimelineIcon}
          active={activeTool === 'timeline'}
          tutorialId="tahkir-tool-timeline"
          onClick={toggleTimeline}
        />
        <ToolButton
          label="יצירה"
          icon={figmaAssets.tahkirCreateIcon}
          active={activeTool === 'create'}
          title="יצירת תחקיר"
          tutorialId="tahkir-tool-create"
          onClick={toggleCreate}
        />
        <ToolButton
          label="תחקור מרחב"
          icon={figmaAssets.tahkirSpaceIcon}
          active={activeTool === 'space'}
          tutorialId="tahkir-tool-space"
          onClick={toggleSpace}
        />
      </div>
    </aside>
  );
}
