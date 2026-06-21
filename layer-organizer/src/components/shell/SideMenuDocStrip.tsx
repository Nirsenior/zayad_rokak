import type { ReactNode } from 'react';
import { figmaAssets } from '../../assets/figmaAssets';

const BTN = 40;
const GAP = 3;
const PAD = 4;
const STRIP_W = BTN * 3 + GAP * 2 + PAD * 2;
const STRIP_H = BTN + PAD * 2;

/** Figma אקוסיסטם ציד — 393:36740 (רקע), 36748 (וידאו), 36741 (צ'אט), 36742+36744 (+) */
export function SideMenuDocStrip() {
  return (
    <div
      aria-label="מסמכים וצ'אט"
      style={{
        position: 'relative',
        width: STRIP_W,
        height: STRIP_H,
        flexShrink: 0,
        boxSizing: 'border-box',
      }}
    >
      {/* 393:36740 — רקע מטושטש */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backdropFilter: 'blur(1.846px)',
          WebkitBackdropFilter: 'blur(1.846px)',
          background: '#a7a7a7',
          border: '0.462px solid #d4d4d4',
          opacity: 0.6,
          borderRadius: 8,
          boxSizing: 'border-box',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: GAP,
          padding: PAD,
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* 393:36748 — וידאו */}
        <DocStripButton
          title="וידאו"
          gradient="linear-gradient(180deg, #ff6464 0%, #ff0000 100%)"
          shadow="0 0 4.583px rgba(0,0,0,0.4)"
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '25.33%',
                right: '16.67%',
                bottom: '25.34%',
                left: '16.67%',
              }}
            >
              <img
                src={figmaAssets.sideDocVideo1}
                alt=""
                style={{ display: 'block', width: '100%', height: '100%' }}
              />
            </div>
            <div
              style={{
                position: 'absolute',
                top: '25%',
                right: '16.67%',
                bottom: '25%',
                left: '16.67%',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '-14.62%',
                  right: '-10.97%',
                  bottom: '-14.62%',
                  left: '-10.97%',
                }}
              >
                <img
                  src={figmaAssets.sideDocVideo2}
                  alt=""
                  style={{ display: 'block', width: '100%', height: '100%' }}
                />
              </div>
            </div>
          </div>
        </DocStripButton>

        {/* 393:36741 — צ'אט */}
        <DocStripButton
          title="צ'אט"
          gradient="linear-gradient(237.73deg, rgb(71, 165, 227) 13.75%, rgb(0, 144, 213) 86.25%)"
          shadow="0 0 4.615px rgba(0,0,0,0.4)"
        >
          <img
            src={figmaAssets.sideDocChat}
            alt=""
            style={{
              display: 'block',
              width: '95%',
              height: '95%',
              margin: 'auto',
              objectFit: 'contain',
            }}
          />
        </DocStripButton>

        {/* 393:36742 + 36744 — הוספה */}
        <DocStripButton
          title="הוסף"
          background="#bbc0ca"
          shadow="0 0 4.333px rgba(0,0,0,0.5)"
        >
          <img
            src={figmaAssets.sideDocPlus}
            alt=""
            style={{
              display: 'block',
              width: '50%',
              height: '50%',
              margin: 'auto',
              objectFit: 'contain',
            }}
          />
        </DocStripButton>
      </div>
    </div>
  );
}

function DocStripButton({
  title,
  gradient,
  background,
  shadow,
  children,
}: {
  title: string;
  gradient?: string;
  background?: string;
  shadow: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      style={{
        position: 'relative',
        width: BTN,
        height: BTN,
        padding: 0,
        border: 'none',
        borderRadius: 6,
        background: background ?? gradient,
        boxShadow: shadow,
        cursor: 'default',
        flexShrink: 0,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {children}
    </button>
  );
}
