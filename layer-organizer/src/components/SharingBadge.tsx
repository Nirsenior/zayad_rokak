import type { SharingMode } from '../types';
import { SHARING_MODE_SHORT_LABELS } from '../constants/sharingMode';

const TITLES: Record<SharingMode, string> = {
  unit: 'יחידתי — רק היחידה שלי',
  brigade: 'עוצבתי — כל החטיבה',
  pool: 'מאגר — כולם רואים את אותה שכבה',
};

export function SharingBadge({ mode }: { mode: SharingMode | null }) {
  if (!mode) return null;
  const label = SHARING_MODE_SHORT_LABELS[mode];
  return (
    <span
      title={TITLES[mode]}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        flexShrink: 0,
        cursor: 'default',
        opacity: 0.85,
      }}
    >
      <span
        style={{
          fontSize: 'var(--ds-org-text-xs)',
          fontWeight: 600,
          color: `var(--ds-share-${mode})`,
          fontFamily: 'inherit',
          letterSpacing: 0,
        }}
      >
        {label}
      </span>
    </span>
  );
}
