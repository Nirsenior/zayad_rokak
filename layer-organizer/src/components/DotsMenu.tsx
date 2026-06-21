import { useState, useEffect, useRef } from 'react';

interface MenuItem {
  label: string;
  icon?: string;
  onClick: () => void;
  danger?: boolean;
}

interface Props {
  items: MenuItem[];
  align?: 'left' | 'right';
  tutorialId?: string;
}

export function DotsMenu({ items, align = 'left', tutorialId }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div ref={ref} data-tutorial-id={tutorialId} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        title="אפשרויות נוספות"
        style={{
          background: open ? 'var(--ds-organizer-hover)' : 'none',
          border: '1px solid var(--ds-organizer-border)',
          borderRadius: 4,
          padding: '5px 8px',
          cursor: 'pointer',
          color: open ? 'var(--ds-text-heading)' : 'var(--ds-text-muted)',
          fontSize: 'var(--ds-org-text-lg)',
          lineHeight: 1,
          letterSpacing: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s',
          fontFamily: 'inherit',
        }}
        onMouseEnter={e => { if (!open) (e.currentTarget as HTMLElement).style.color = 'var(--ds-text-heading)'; }}
        onMouseLeave={e => { if (!open) (e.currentTarget as HTMLElement).style.color = 'var(--ds-text-muted)'; }}
      >
        ⋮
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            ...(align === 'left' ? { left: 0 } : { right: 0 }),
            background: 'var(--ds-organizer-surface)',
            border: '1px solid var(--ds-organizer-border)',
            borderRadius: 6,
            boxShadow: '0 8px 24px #00000088',
            zIndex: 1000,
            minWidth: 160,
            overflow: 'hidden',
            direction: 'rtl',
          }}
        >
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => { item.onClick(); setOpen(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '9px 14px',
                background: 'none',
                border: 'none',
                borderBottom: i < items.length - 1 ? '1px solid var(--ds-organizer-border)' : 'none',
                cursor: 'pointer',
                fontSize: 'var(--ds-org-text-base)',
                color: item.danger ? '#ef4444' : 'var(--ds-text-secondary)',
                textAlign: 'right',
                direction: 'rtl',
                fontFamily: 'inherit',
                transition: 'background 0.1s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--ds-organizer-hover)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'none')}
            >
              {item.icon && <span style={{ fontSize: 'var(--ds-org-text-base)' }}>{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
