import { figmaAssets } from '../../../assets/figmaAssets';
import {
  SIDEBAR_COMPOSITE_DEV_RESPONSIBILITY,
  sidebarHoverTitle,
} from '../../../utils/sidebarHoverTitle';

export function SideMenuAiButton() {
  return (
    <button
      type="button"
      title={sidebarHoverTitle('AI', SIDEBAR_COMPOSITE_DEV_RESPONSIBILITY.ai)}
      style={{
        position: 'relative',
        width: 44,
        height: 44,
        padding: 0,
        border: '1px solid #14151a',
        borderRadius: 8,
        background: 'linear-gradient(220.1deg, rgb(98, 105, 124) 4.32%, rgb(33, 36, 43) 95.84%)',
        boxShadow: '0 2px 3.5px rgba(0,0,0,0.5)',
        cursor: 'default',
        boxSizing: 'border-box',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 30,
          height: 30,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '8.33%',
            right: '11.67%',
            bottom: '11.67%',
            left: '8.33%',
          }}
        >
          <div style={{ position: 'absolute', inset: '-8.33%' }}>
            <img src={figmaAssets.sideAiIcon} alt="" style={{ display: 'block', width: '100%', height: '100%' }} />
          </div>
        </div>
      </div>
    </button>
  );
}
