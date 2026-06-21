import type { VisibilityLevel } from '../types';
import { TankIcon, FlagIcon, BuildingIcon } from './Icons';

const CONFIG: Record<VisibilityLevel, { Icon: typeof TankIcon; color: string; title: string }> = {
  'techno-tactical': { Icon: TankIcon,    color: '#22c55e', title: 'טכנו-טקטי — יורד עד הטנק' },
  'tactical-hq':     { Icon: FlagIcon,    color: '#eab308', title: 'מפקדה טקטית — עד מפקד פלוגה' },
  'hq-only':         { Icon: BuildingIcon, color: '#ef4444', title: 'מפקדה בלבד' },
};

export function VisibilityBadge({ level }: { level: VisibilityLevel }) {
  const { Icon, color, title } = CONFIG[level];
  return (
    <span
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        flexShrink: 0,
        opacity: 0.85,
        cursor: 'default',
      }}
    >
      <Icon size={13} color={color} />
    </span>
  );
}
