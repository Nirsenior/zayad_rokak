import { useState } from 'react';
import type { SidebarNavItemId } from '../../types/sidebarUi';
import { SIDEBAR_NAV_REGISTRY } from '../../data/rules/sidebarMenuRegistry';
import { ICT_SUB_NAV } from '../../data/rules/ictSubNav';

type Props = {
  activeNavId: SidebarNavItemId | null;
};

function SubIcon({ path }: { path: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      aria-hidden="true"
      style={{ flexShrink: 0, display: 'block' }}
    >
      <path d={path} fill="currentColor" />
    </svg>
  );
}

export function IctSecondarySidebar({ activeNavId }: Props) {
  const [activeSubId, setActiveSubId] = useState<string | null>(null);

  if (!activeNavId) return null;
  const subItems = ICT_SUB_NAV[activeNavId];
  if (!subItems || subItems.length === 0) return null;

  const parentLabel = SIDEBAR_NAV_REGISTRY[activeNavId]?.label ?? '';

  return (
    <aside
      aria-label={`תפריט משני — ${parentLabel}`}
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        background: 'rgba(22, 24, 30, 0.94)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
        boxShadow: '-2px 0 12px rgba(0, 0, 0, 0.45)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Assistant, var(--ds-font)',
        direction: 'rtl',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      {/* כותרת */}
      <div
        style={{
          padding: '12px 14px 8px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          flexShrink: 0,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontWeight: 700,
            fontSize: 13,
            lineHeight: '18px',
            color: 'rgba(241, 247, 254, 0.55)',
            letterSpacing: '0.2px',
          }}
        >
          {parentLabel}
        </h2>
      </div>

      {/* פריטים */}
      <ul
        style={{
          margin: 0,
          padding: '6px 0',
          listStyle: 'none',
          flex: 1,
        }}
      >
        {subItems.map((item) => {
          const active = item.id === activeSubId;
          return (
            <li key={item.id}>
              <button
                type="button"
                title={item.label}
                onClick={() => setActiveSubId(active ? null : item.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  padding: '7px 14px',
                  border: 'none',
                  borderRadius: 0,
                  background: active
                    ? 'rgba(255, 255, 255, 0.10)'
                    : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'right',
                  boxSizing: 'border-box',
                  color: active ? '#f1f7fe' : 'rgba(241, 247, 254, 0.65)',
                  transition: 'background 0.12s, color 0.12s',
                  borderRight: active
                    ? '2px solid rgba(120, 160, 220, 0.75)'
                    : '2px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (!active)
                    (e.currentTarget as HTMLButtonElement).style.background =
                      'rgba(255, 255, 255, 0.05)';
                }}
                onMouseLeave={(e) => {
                  if (!active)
                    (e.currentTarget as HTMLButtonElement).style.background =
                      'transparent';
                }}
              >
                <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                  <SubIcon path={item.iconPath} />
                </span>
                <span
                  style={{
                    fontWeight: active ? 600 : 400,
                    fontSize: 13,
                    lineHeight: '18px',
                    letterSpacing: '0.1px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
