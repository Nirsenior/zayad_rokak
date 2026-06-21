import { useTahkirUi } from '../../context/TahkirUiContext';
import { TAHKIR_TIMELINE_H } from './shellLayout';
import { SideMenuDocStrip } from './SideMenuDocStrip';

const DOCK_BOTTOM = 16;

/** קישורים חיצוניים (וידאו / צ'אט / +) — תחתית מרכז המסך, מחוץ לסיידבר */
export function MapExternalLinksDock() {
  const { timelineOpen } = useTahkirUi();
  const bottom = timelineOpen ? TAHKIR_TIMELINE_H + DOCK_BOTTOM : DOCK_BOTTOM;

  return (
    <div
      aria-label="קישורים חיצוניים"
      style={{
        position: 'absolute',
        left: '50%',
        bottom,
        transform: 'translateX(-50%)',
        zIndex: 115,
        pointerEvents: 'auto',
      }}
    >
      <SideMenuDocStrip />
    </div>
  );
}
