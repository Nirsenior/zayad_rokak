import { figmaAssets } from '../../assets/figmaAssets';

const W = 54;
const H = 38;

type Props = {
  open: boolean;
  onClick: () => void;
};

/** כפתור פתיחה/סגירה לסיידבר — Figma 393:34619 */
export function SidebarToggleButton({ open, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={open ? 'סגור סיידבר' : 'פתח סיידבר'}
      aria-expanded={open}
      aria-label={open ? 'סגור סיידבר' : 'פתח סיידבר'}
      style={{
        position: 'relative',
        width: W,
        height: H,
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        padding: 0,
        display: 'block',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-5.26%',
          right: '-3.7%',
          bottom: '-5.26%',
          left: '-3.7%',
          pointerEvents: 'none',
        }}
      >
        <img
          src={figmaAssets.sidebarToggleBg}
          alt=""
          style={{ display: 'block', width: '100%', height: '100%' }}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          top: '10.53%',
          right: '7.41%',
          bottom: '10.53%',
          left: '37.04%',
          pointerEvents: 'none',
        }}
      >
        <div style={{ position: 'absolute', inset: '-6.67%' }}>
          <img
            src={figmaAssets.sidebarToggleHighlight}
            alt=""
            style={{ display: 'block', width: '100%', height: '100%' }}
          />
        </div>
      </div>

      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: 1,
          top: 10,
          width: 18,
          height: 18,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '39.58%',
            right: '29.16%',
            bottom: '39.58%',
            left: '29.17%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              transform: open ? 'rotate(-180deg) scaleX(-1)' : 'none',
              transition: 'transform 0.15s ease',
            }}
          >
            <img
              src={figmaAssets.sidebarToggleChevron}
              alt=""
              style={{ display: 'block', width: '100%', height: '100%' }}
            />
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: '42.85%',
          right: '15.77%',
          top: '50%',
          transform: 'translateY(-50%)',
          aspectRatio: '1',
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '12.5%',
            right: '37.5%',
            bottom: '12.5%',
            left: '25%',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-11.93%',
              right: '-23.87%',
              bottom: '-11.93%',
              left: '-23.87%',
            }}
          >
            <img
              src={figmaAssets.sidebarToggleIcon}
              alt=""
              style={{ display: 'block', width: '100%', height: '100%' }}
            />
          </div>
        </div>
      </div>
    </button>
  );
}
