interface IconProps {
  size?: number;
  color?: string;
}

export function EyeOpenIcon({ size = 16, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size * 0.65} viewBox="0 0 20 13" fill="none" style={{ display: 'block' }}>
      <path
        d="M1 6.5C3.5 2 6.5 0.5 10 0.5C13.5 0.5 16.5 2 19 6.5C16.5 11 13.5 12.5 10 12.5C6.5 12.5 3.5 11 1 6.5Z"
        stroke={color} strokeWidth="1.4" strokeLinejoin="round"
      />
      <circle cx="10" cy="6.5" r="2.8" fill={color} />
      <circle cx="11.2" cy="5.3" r="0.9" fill="white" opacity="0.5" />
    </svg>
  );
}

export function EyeOffIcon({ size = 16, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size * 0.65} viewBox="0 0 20 13" fill="none" style={{ display: 'block' }}>
      <path
        d="M1 6.5C3.5 2 6.5 0.5 10 0.5C13.5 0.5 16.5 2 19 6.5C16.5 11 13.5 12.5 10 12.5C6.5 12.5 3.5 11 1 6.5Z"
        stroke={color} strokeWidth="1.4" strokeLinejoin="round" opacity="0.35"
      />
      <circle cx="10" cy="6.5" r="2.8" fill={color} opacity="0.2" />
      <line x1="3" y1="11.5" x2="17" y2="1.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function FilterIcon({ size = 13, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" style={{ display: 'block' }}>
      <path
        d="M1.5 2H12.5L8.5 7V12.5L5.5 11V7L1.5 2Z"
        stroke={color} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round"
      />
    </svg>
  );
}

export function EditIcon({ size = 13, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" style={{ display: 'block' }}>
      <path
        d="M2 10.5L10.5 2L12.5 4L4 12.5L1.5 13L2 10.5Z"
        stroke={color} strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round"
      />
      <path d="M9 3.5L11 5.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function DragIcon({ size = 12, color = 'currentColor' }: IconProps) {
  const dots = [
    [2, 2], [6, 2],
    [2, 6], [6, 6],
    [2, 10], [6, 10],
  ];
  return (
    <svg width={size * 0.7} height={size} viewBox="0 0 8 12" fill="none" style={{ display: 'block' }}>
      {dots.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="1.2" fill={color} />
      ))}
    </svg>
  );
}

export function LabelIcon({ size = 13, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" style={{ display: 'block' }}>
      <rect x="0.7" y="0.7" width="12.6" height="8.5" rx="2" stroke={color} strokeWidth="1.3" />
      <line x1="3" y1="3.5" x2="11" y2="3.5" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
      <line x1="3" y1="6"   x2="8.5" y2="6"   stroke={color} strokeWidth="1.1" strokeLinecap="round" />
      <path d="M3.5 9.2L2 13" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function TankIcon({ size = 14, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 16 11" fill="none" style={{ display: 'block' }}>
      <rect x="1" y="6.5" width="14" height="3.5" rx="1.7" stroke={color} strokeWidth="1.2" />
      <rect x="3" y="3.5" width="8.5" height="3.5" rx="0.8" stroke={color} strokeWidth="1.2" />
      <rect x="5" y="1.2" width="4.5" height="2.8" rx="0.6" stroke={color} strokeWidth="1.2" />
      <line x1="9" y1="2.6" x2="15" y2="2.6" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function FlagIcon({ size = 13, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size * 0.85} height={size} viewBox="0 0 11 14" fill="none" style={{ display: 'block' }}>
      <line x1="2" y1="1" x2="2" y2="13.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M2 1.5L10 5L2 8.5Z" stroke={color} strokeWidth="1.1" fill={color} fillOpacity="0.35" strokeLinejoin="round" />
    </svg>
  );
}

export function BuildingIcon({ size = 13, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" style={{ display: 'block' }}>
      <path d="M1.5 5.5L7 1.5L12.5 5.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="2" y="5.5" width="10" height="7" stroke={color} strokeWidth="1.3" />
      <rect x="5.5" y="9" width="3" height="3.5" stroke={color} strokeWidth="1.1" />
    </svg>
  );
}

export function LockIcon({ size = 11, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 14" fill="none" style={{ display: 'block' }}>
      <rect x="1.5" y="6" width="9" height="7" rx="1.5" stroke={color} strokeWidth="1.3" />
      <path d="M3.5 6V4.5a2.5 2.5 0 0 1 5 0V6" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="6" cy="9.5" r="1" fill={color} />
    </svg>
  );
}

/** רוחב יחידתי — עיגול בודד */
export function ShareUnitIcon({ size = 12, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" style={{ display: 'block' }}>
      <circle cx="6" cy="6" r="3.2" stroke={color} strokeWidth="1.15" fill={color} fillOpacity={0.22} />
    </svg>
  );
}

/** רוחב עוצבתי — שלושה עיגולים מחוברים */
export function ShareBrigadeIcon({ size = 12, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" style={{ display: 'block' }}>
      <circle cx="3" cy="6" r="2" stroke={color} strokeWidth="1.05" fill={color} fillOpacity={0.22} />
      <circle cx="9" cy="3" r="2" stroke={color} strokeWidth="1.05" fill={color} fillOpacity={0.22} />
      <circle cx="9" cy="9" r="2" stroke={color} strokeWidth="1.05" fill={color} fillOpacity={0.22} />
      <line x1="5" y1="5.2" x2="7.2" y2="4" stroke={color} strokeWidth="0.95" />
      <line x1="5" y1="6.8" x2="7.2" y2="8" stroke={color} strokeWidth="0.95" />
    </svg>
  );
}

/** רוחב מאגר — דלי */
export function SharePoolIcon({ size = 12, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" style={{ display: 'block' }}>
      <path
        d="M3.2 5.2h5.6l-.9 4.8H4.1l-.9-4.8z"
        stroke={color}
        strokeWidth="1.05"
        strokeLinejoin="round"
        fill={color}
        fillOpacity={0.18}
      />
      <path
        d="M3.2 5.2c0-1.1 1.35-1.7 2.8-1.7s2.8.6 2.8 1.7"
        stroke={color}
        strokeWidth="1.05"
        strokeLinecap="round"
      />
      <path
        d="M4.3 3.5V2.6M7.7 3.5V2.6M4.3 2.6h3.4"
        stroke={color}
        strokeWidth="1.05"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AddLayerIcon({ size = 13, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" style={{ display: 'block' }}>
      <rect x="1" y="1" width="12" height="12" rx="2" stroke={color} strokeWidth="1.3" />
      <line x1="7" y1="4" x2="7" y2="10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="4" y1="7" x2="10" y2="7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
