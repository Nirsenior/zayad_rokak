import { figmaAssets } from '../../assets/figmaAssets';
import { MapCompass } from './MapCompass';
import { MapFooter } from './MapFooter';
import { MapActions } from './MapActions';

/** אזור מפה — רקע ו-overlay מ-Figma "חיפוש סגור" */
export function MapViewport() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: '#0a0c10',
      }}
    >
      <img
        src={figmaAssets.mapBackground}
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          pointerEvents: 'none',
        }}
      />

      <MapCompass />
      <MapFooter />
      <MapActions />
    </div>
  );
}
