import type { CSSProperties, ReactNode } from 'react';
import { figmaAssets } from '../../assets/figmaAssets';

const W = 304;
const H = 50;

const pill: CSSProperties = {
  position: 'absolute',
  background: 'rgba(20, 21, 26, 0.82)',
  border: '0.8px solid #b9bbc6',
  borderRadius: 6,
  boxSizing: 'border-box',
};

/** טקסט מ-Figma — wrapper עם inset, בלי flex שמכווץ גובה */
function FooterText({
  inset,
  style,
  children,
}: {
  inset: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const [top, right, bottom, left] = inset.split(/\s+/);
  return (
    <div
      style={{
        position: 'absolute',
        top,
        right,
        bottom,
        left,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        lineHeight: 0,
        pointerEvents: 'none',
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: 'Inter, Arial, sans-serif',
          fontWeight: 400,
          fontStyle: 'normal',
          lineHeight: 'normal',
          whiteSpace: 'nowrap',
          wordBreak: 'break-word',
          ...style,
        }}
      >
        {children}
      </p>
    </div>
  );
}

/** Footer — מבנה מדויק מ-Figma 451:107860 */
export function MapFooter() {
  return (
    <div
      style={{
        position: 'absolute',
        left: 60,
        bottom: 21,
        width: W,
        height: H,
        pointerEvents: 'none',
      }}
    >
      <div style={{ ...pill, top: '47.62%', right: '49.45%', bottom: 0, left: 0 }} />
      <div style={{ ...pill, top: '47.19%', right: '30.81%', bottom: '0.43%', left: '52.61%' }} />
      <div style={{ ...pill, top: '47.19%', right: 0, bottom: '0.43%', left: '71.3%' }} />

      <FooterText inset="0 85.25% 70.24% 2.9%" style={{ fontSize: 12.8, color: '#fff', textAlign: 'right', textShadow: '0 0 3.2px rgba(0,0,0,0.33)' }}>
        150 m
      </FooterText>

      <div
        style={{
          position: 'absolute',
          top: '23.81%',
          right: '83.68%',
          bottom: '66.67%',
          left: '1.32%',
          overflow: 'visible',
        }}
      >
        <div style={{ position: 'absolute', top: '-84%', right: '-8.77%', bottom: '-84%', left: '-8.77%' }}>
          <img
            src={figmaAssets.footerScale}
            alt=""
            style={{ display: 'block', width: '100%', height: '100%', maxWidth: 'none' }}
          />
        </div>
      </div>

      <FooterText
        inset="60.32% 51.49% 11.9% 2.11%"
        style={{ fontSize: 11.2, opacity: 0.9, color: 'rgba(255,255,255,0.9)' }}
      >
        <span style={{ color: '#e4e7ef' }}>36 </span>
        <span style={{ color: '#fff' }}>774635 </span>
        <span style={{ color: 'rgba(228,231,239,0.6)' }}>E </span>
        <span style={{ color: '#e4e7ef' }}>/ </span>
        <span style={{ color: '#e4e7ef' }}>3 </span>
        <span style={{ color: '#fff' }}>558374 </span>
        <span style={{ color: 'rgba(228,231,239,0.6)' }}> N</span>
      </FooterText>

      <FooterText inset="59.89% 33.7% 12.33% 54.45%" style={{ fontSize: 11.2, color: '#fff', textAlign: 'right' }}>
        <span style={{ color: '#fff' }}>743 </span>
        <span style={{ color: 'rgba(255,255,255,0.9)' }}> </span>
        <span style={{ color: 'rgba(228,231,239,0.6)' }}>מ׳</span>
      </FooterText>

      <FooterText inset="59.1% 1.58% 13.13% 73.41%" style={{ fontSize: 11.2, color: '#fff', textAlign: 'right' }}>
        <span style={{ color: 'rgba(255,255,255,0.6)' }}>זמב </span>
        <span style={{ color: '#e4e7ef' }}>25, 29, 53</span>
      </FooterText>
    </div>
  );
}
