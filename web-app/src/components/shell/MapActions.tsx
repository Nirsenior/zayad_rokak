import { figmaAssets } from '../../assets/figmaAssets';

const W = 41;
const H = 137;

function GlowImg({ src, inset }: { src: string; inset: string }) {
  return (
    <div style={{ position: 'absolute', inset, overflow: 'visible' }}>
      <div
        style={{
          position: 'absolute',
          top: '-12.2%',
          right: '-17.07%',
          bottom: '-21.95%',
          left: '-17.07%',
        }}
      >
        <img src={src} alt="" style={{ display: 'block', width: '100%', height: '100%' }} />
      </div>
    </div>
  );
}

/** actions — Figma 451:107861 (רקעים ואז אייקונים מעל) */
export function MapActions() {
  return (
    <div
      aria-label="פעולות מפה"
      style={{
        position: 'absolute',
        left: 8,
        top: 881,
        width: W,
        height: H,
        pointerEvents: 'none',
      }}
    >
      <GlowImg src={figmaAssets.actionMidBg} inset="36.86% 0 33.21% 0" />
      <GlowImg src={figmaAssets.actionTopBg} inset="4.01% 0 66.06% 0" />
      <GlowImg src={figmaAssets.actionBottomBg} inset="70.14% 0.5% -0.19% -0.5%" />

      {/* Tech — כפתור עליון */}
      <div
        style={{
          position: 'absolute',
          top: '8.03%',
          bottom: '70.07%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 30,
          overflow: 'hidden',
          zIndex: 1,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '19%',
            right: '18.33%',
            bottom: '19.18%',
            left: '18.33%',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-13.48%',
              right: '-13.16%',
              bottom: '-13.48%',
              left: '-13.16%',
            }}
          >
            <img src={figmaAssets.actionTechIcon} alt="" style={{ display: 'block', width: '100%', height: '100%' }} />
          </div>
        </div>
      </div>

      {/* Map — כפתור תחתון (אמצעי = אייקון ב-action-mid-bg.svg) */}
      <div
        style={{
          position: 'absolute',
          top: '74.22%',
          right: '13.41%',
          bottom: '3.89%',
          left: '13.41%',
          overflow: 'hidden',
          filter: 'drop-shadow(0 0 1.25px rgba(0,0,0,0.6))',
          zIndex: 1,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '26.67%',
            right: '13.33%',
            bottom: '28.7%',
            left: '13.33%',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-18.67%',
              right: '-11.36%',
              bottom: '-18.67%',
              left: '-11.36%',
            }}
          >
            <img src={figmaAssets.actionMapIcon} alt="" style={{ display: 'block', width: '100%', height: '100%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
