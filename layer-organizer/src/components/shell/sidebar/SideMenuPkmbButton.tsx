import { figmaAssets } from '../../../assets/figmaAssets';
import {
  SIDEBAR_COMPOSITE_DEV_RESPONSIBILITY,
  sidebarHoverTitle,
} from '../../../utils/sidebarHoverTitle';

const BTN = 43;

function PkmbIcon() {
  return (
    <div
      style={{
        position: 'absolute',
        top: '15.91%',
        right: '15.91%',
        bottom: '15.91%',
        left: '15.91%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <img
        src={figmaAssets.sideMenuPkmbIcon}
        alt=""
        style={{ display: 'block', width: '70%', height: '70%', maxWidth: 'none' }}
      />
    </div>
  );
}

/** פקמ"ב — משותף לכל המאמצים והתפקידים (Figma file-text / דוחות) */
export function SideMenuPkmbButton() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        flexShrink: 0,
      }}
    >
      <button
        type="button"
        title={sidebarHoverTitle('פקמ"ב', SIDEBAR_COMPOSITE_DEV_RESPONSIBILITY.pkmb)}
        style={{
          position: 'relative',
          width: BTN,
          height: 44,
          padding: 0,
          border: '1px solid #474747',
          borderRadius: 8,
          background: '#3a3b40',
          boxShadow: '0 0 2px rgba(0,0,0,0.3)',
          cursor: 'default',
          boxSizing: 'border-box',
        }}
      >
        <PkmbIcon />
      </button>
      <p
        style={{
          margin: '4px 0 0',
          fontFamily: 'Assistant, var(--ds-font)',
          fontWeight: 400,
          fontSize: 12,
          lineHeight: 'normal',
          color: '#b5bac6',
          textAlign: 'center',
          whiteSpace: 'nowrap',
        }}
      >
        {'פקמ"ב'}
      </p>
    </div>
  );
}
