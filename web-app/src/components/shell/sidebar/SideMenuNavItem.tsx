import type { SidebarNavItemResolved } from '../../../types/sidebarUi';
import { sidebarHoverTitle } from '../../../utils/sidebarHoverTitle';

const BTN = 43;

function MenuIcon({ src, rotate }: { src: string; rotate?: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <img
        src={src}
        alt=""
        width={20}
        height={20}
        style={{
          display: 'block',
          maxWidth: 'none',
          transform: rotate ? `rotate(${rotate}deg)` : undefined,
          objectFit: 'contain',
        }}
      />
    </div>
  );
}

type Props = {
  item: SidebarNavItemResolved;
  onClick?: () => void;
};

export function SideMenuNavItem({ item, onClick }: Props) {
  const active = item.active;
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
        title={sidebarHoverTitle(item.label, item.devResponsibility)}
        onClick={onClick}
        style={{
          position: 'relative',
          width: BTN,
          height: 44,
          padding: 0,
          border: active ? '1px solid #989ca6' : '1px solid #474747',
          borderRadius: 8,
          background: active
            ? 'linear-gradient(222.29deg, #676b72 2.16%, #4f5259 97.84%)'
            : '#3a3b40',
          boxShadow: active ? '0 0 1px rgba(0,0,0,0.8)' : '0 0 2px rgba(0,0,0,0.3)',
          cursor: onClick ? 'pointer' : 'default',
          boxSizing: 'border-box',
        }}
      >
        <MenuIcon src={item.icon} rotate={item.iconRotate} />
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
        {item.label}
      </p>
    </div>
  );
}
