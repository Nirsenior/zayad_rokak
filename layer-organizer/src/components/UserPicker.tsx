import { useState, useRef, useEffect } from 'react';
import { useAppSession } from '../context/AppSessionContext';
import { TEST_PERSONAS } from '../data/catalog/users';
import { figmaAssets } from '../assets/figmaAssets';

type UserPickerProps = {
  variant?: 'default' | 'ds';
};

export function UserPicker({ variant = 'default' }: UserPickerProps) {
  const { session, switchUser } = useAppSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const currentUser = TEST_PERSONAS.find(u => u.id === session.userId) ?? TEST_PERSONAS[0];

  function handleSwitch(userId: string) {
    switchUser(userId);
    setOpen(false);
  }

  const isDs = variant === 'ds';

  return (
    <div ref={ref} style={{ position: 'relative', fontFamily: 'var(--ds-font)' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        title="בחירת משתמש"
        style={
          isDs
            ? {
                position: 'relative',
                width: 235,
                height: 38,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: 0,
                textAlign: 'right',
                direction: 'rtl',
              }
            : {
                background: '#060f1e',
                border: '1px solid #1e3a5f',
                borderRadius: 6,
                padding: '5px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: '#7ab3d4',
                fontSize: 12,
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }
        }
        onMouseEnter={e => {
          if (!isDs) (e.currentTarget as HTMLElement).style.borderColor = '#1e90ff66';
        }}
        onMouseLeave={e => {
          if (!isDs) (e.currentTarget as HTMLElement).style.borderColor = '#1e3a5f';
        }}
      >
        {isDs && (
          <img
            src={figmaAssets.userCardBg}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'fill',
              pointerEvents: 'none',
            }}
          />
        )}
        {isDs ? (
          <span
            style={{
              position: 'relative',
              display: 'block',
              padding: '4px 36px 4px 12px',
              direction: 'rtl',
            }}
          >
            <span
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--ds-text-heading)',
                lineHeight: '16px',
              }}
            >
              {currentUser.name}
            </span>
            <span
              style={{
                display: 'block',
                fontSize: 12,
                color: 'var(--ds-text-secondary)',
                lineHeight: '16px',
              }}
            >
              {currentUser.description || 'משתמש'}
            </span>
          </span>
        ) : (
          <>
            <span style={{ fontSize: 13 }}>👤</span>
            <span>{currentUser.name}</span>
            {currentUser.description && (
              <span style={{ fontSize: 10, color: '#3a6080' }}>· {currentUser.description}</span>
            )}
            <span style={{ fontSize: 9, color: '#2a5070' }}>{open ? '▲' : '▼'}</span>
          </>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: 0,
          minWidth: 210,
          background: '#0a1628',
          border: '1px solid #1e3a5f',
          borderRadius: 6,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          zIndex: 2000,
          overflow: 'hidden',
          direction: 'rtl',
        }}>
          <div style={{ padding: '5px 12px 4px', fontSize: 9, fontWeight: 700, letterSpacing: 0.8, color: '#1e90ff', background: '#060f1e', borderBottom: '1px solid #0d1f38' }}>
            בחירת משתמש
          </div>

          {TEST_PERSONAS.map(user => {
            const active = user.id === session.userId;
            return (
              <button
                key={user.id}
                onClick={() => handleSwitch(user.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', padding: '7px 14px',
                  background: active ? '#1a3050' : 'none',
                  border: 'none', cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'background 0.1s',
                  borderBottom: '1px solid #060f1e',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#0f1f3a'; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'none'; }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: active ? '#1e90ff' : '#1a3050', flexShrink: 0 }} />
                <span style={{ flex: 1, textAlign: 'right' }}>
                  <span style={{ fontSize: 12, color: active ? '#c8d8f0' : '#4a7090', fontWeight: active ? 600 : 400 }}>
                    {user.name}
                  </span>
                  {user.description && (
                    <span style={{ fontSize: 10, color: '#2a5070', marginRight: 5 }}>· {user.description}</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
