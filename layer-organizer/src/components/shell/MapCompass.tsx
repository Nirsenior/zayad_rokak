import { figmaAssets } from '../../assets/figmaAssets';

const W = 48;
const H = 214.5;

/** Compass — Figma 451:107859 */
export function MapCompass() {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        left: 7,
        top: 31,
        width: W,
        height: H,
        pointerEvents: 'none',
      }}
    >
      {/* Component 15 — חוג + מחט אדומה */}
      <div
        style={{
          position: 'absolute',
          left: '3.41%',
          right: '3.3%',
          top: 0,
          bottom: '79.12%',
          overflow: 'visible',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-18.42%',
            right: '-18.42%',
            bottom: '-18.42%',
            left: '-18.42%',
          }}
        >
          <img
            src={figmaAssets.compassDial}
            alt=""
            style={{ display: 'block', width: '100%', height: '100%' }}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            left: '16.67%',
            right: '16.36%',
            top: '11.12%',
            bottom: '16.26%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '72%',
              height: '72%',
              transform: 'rotate(-30deg)',
              transformOrigin: 'center center',
            }}
          >
            <img
              src={figmaAssets.compassNeedle}
              alt=""
              style={{
                position: 'absolute',
                inset: 0,
                display: 'block',
                width: '100%',
                height: '100%',
                maxWidth: 'none',
              }}
            />
          </div>
        </div>
      </div>

      {/* 2D / 3D */}
      <div
        style={{
          position: 'absolute',
          left: '13.82%',
          right: '14.08%',
          top: '24.95%',
          bottom: '53.23%',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            opacity: 0.85,
            borderRadius: 3.455,
            boxShadow: '0 0 4.071px rgba(0,0,0,0.77)',
          }}
        />
        <p
          style={{
            position: 'absolute',
            left: '27.86%',
            right: '27.86%',
            top: '11.96%',
            bottom: '57.84%',
            margin: 0,
            fontFamily: 'Roboto, Arial, sans-serif',
            fontWeight: 700,
            fontSize: 12.02,
            lineHeight: 'normal',
            color: '#fff',
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          2D
        </p>
        <p
          style={{
            position: 'absolute',
            left: '27.86%',
            right: '27.86%',
            top: '59.05%',
            bottom: '10.75%',
            margin: 0,
            fontFamily: 'Roboto, Arial, sans-serif',
            fontWeight: 700,
            fontSize: 12.02,
            lineHeight: 'normal',
            color: '#fff',
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          3D
        </p>
        <div
          style={{
            position: 'absolute',
            left: '5.42%',
            right: '6.04%',
            top: '3.92%',
            bottom: '50.78%',
            border: '1.353px solid #fff',
            borderRadius: 3.549,
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* זום */}
      <div
        style={{
          position: 'absolute',
          left: '3.41%',
          right: '1.64%',
          top: '109.06px',
          aspectRatio: '1',
          opacity: 0.74,
          backdropFilter: 'blur(1.306px)',
          filter: 'drop-shadow(0 0 1.532px rgba(0,0,0,0.8))',
        }}
      >
        <div style={{ position: 'absolute', top: '3.35%', right: '8.03%', bottom: '6.15%', left: '6.64%' }}>
          <img src={figmaAssets.compassZoomOuter} alt="" style={{ display: 'block', width: '100%', height: '100%' }} />
        </div>
        <div style={{ position: 'absolute', top: '7.07%', right: '12.52%', bottom: '10.41%', left: '11.09%' }}>
          <img src={figmaAssets.compassZoomInner} alt="" style={{ display: 'block', width: '100%', height: '100%' }} />
        </div>
        <div style={{ position: 'absolute', top: '12.59%', right: '42.05%', bottom: '46.17%', left: '16.11%' }}>
          <img src={figmaAssets.compassPlus} alt="" style={{ display: 'block', width: '100%', height: '100%' }} />
        </div>
        <div style={{ position: 'absolute', top: '43.27%', right: '17.96%', bottom: '16.06%', left: '40.79%' }}>
          <div style={{ position: 'absolute', top: 0, right: '-2.22%', bottom: 0, left: '-2.22%' }}>
            <img src={figmaAssets.compassMinus} alt="" style={{ display: 'block', width: '100%', height: '100%' }} />
          </div>
        </div>
      </div>

      {/* Snap */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          bottom: '4.99%',
          width: '93.3%',
          top: '74.14%',
          opacity: 0.77,
          overflow: 'visible',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-18.42%',
            right: '-18.42%',
            bottom: '-18.42%',
            left: '-18.42%',
          }}
        >
          <img src={figmaAssets.compassSnap} alt="" style={{ display: 'block', width: '100%', height: '100%' }} />
        </div>
      </div>
    </div>
  );
}
