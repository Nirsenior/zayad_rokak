import { useState, useEffect, useRef, useLayoutEffect, useCallback, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useAppSession } from '../../../context/AppSessionContext';
import type { SidebarNavItemId, SidebarNavItemResolved } from '../../../types/sidebarUi';
import { loadPinnedIds, savePinnedIds, getDefaultPinnedIds } from '../../../utils/sidebarPins';
import { SideMenuEcosystemTabItem } from './SideMenuEcosystemTabItem';
import { SideMenuNavItem } from './SideMenuNavItem';

const FONT = 'Assistant, var(--ds-font)';

const sectionLabelStyle: CSSProperties = {
  margin: '0 0 6px',
  padding: '0 4px',
  fontFamily: 'var(--ds-font)',
  fontSize: 10,
  fontWeight: 600,
  lineHeight: 1.2,
  color: 'var(--ds-text-caption)',
  textAlign: 'center',
  opacity: 0.85,
};

type Props = {
  effortLabel: string;
  effortItems: SidebarNavItemResolved[];
  roleItems: SidebarNavItemResolved[];
  onNavClick?: (id: SidebarNavItemId) => void;
};

function ManagePanel({
  allItems,
  pinnedIds,
  onToggle,
  onClose,
  anchorRect,
}: {
  allItems: SidebarNavItemResolved[];
  pinnedIds: Set<SidebarNavItemId>;
  onToggle: (id: SidebarNavItemId) => void;
  onClose: () => void;
  anchorRect: DOMRect;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    function onDown(e: PointerEvent) {
      const t = e.target as Node;
      if (panelRef.current?.contains(t)) return;
      onClose();
    }
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, [onClose]);

  useLayoutEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const panelW = 188;
  const right = window.innerWidth - anchorRect.left + 6;
  const maxH = Math.floor(window.innerHeight * 0.7);
  // עגן ליד הכפתור, אבל מנע חריגה למטה מהמסך
  const idealTop = anchorRect.top - 8;
  const top = Math.max(8, Math.min(idealTop, window.innerHeight - maxH - 8));

  return createPortal(
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        top,
        right,
        width: panelW,
        maxHeight: maxH,
        overflowY: 'auto',
        background: 'rgba(20, 21, 26, 0.96)',
        border: '1px solid rgba(87, 95, 112, 0.5)',
        borderRadius: 8,
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        zIndex: 2400,
        direction: 'rtl',
        fontFamily: FONT,
        padding: '8px 0 6px',
      }}
    >
      {/* כותרת */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 10px 6px',
          borderBottom: '1px solid rgba(87,95,112,0.3)',
          marginBottom: 4,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: '#cddce7' }}>ניהול קומפוננטות</span>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.45)',
            cursor: 'pointer',
            fontSize: 14,
            lineHeight: 1,
            padding: '0 2px',
          }}
        >
          ✕
        </button>
      </div>

      {/* רשימת פריטים */}
      {allItems.map(item => {
        const pinned = pinnedIds.has(item.id);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onToggle(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '5px 10px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              textAlign: 'right',
              direction: 'rtl',
              fontFamily: FONT,
            }}
          >
            {/* אינדיקטור מוצמד/מוסתר */}
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                border: `1px solid ${pinned ? '#4c8af7' : 'rgba(255,255,255,0.2)'}`,
                background: pinned ? '#4c8af7' : 'transparent',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                color: '#fff',
                transition: 'all 0.12s ease',
              }}
            >
              {pinned ? '✓' : ''}
            </span>

            {/* אייקון קטן */}
            <img
              src={item.icon}
              alt=""
              width={14}
              height={14}
              style={{
                flexShrink: 0,
                objectFit: 'contain',
                opacity: item.locked ? 0.4 : pinned ? 1 : 0.55,
              }}
            />

            {/* תווית */}
            <span
              style={{
                flex: 1,
                fontSize: 12,
                lineHeight: '16px',
                color: item.locked
                  ? 'rgba(255,255,255,0.35)'
                  : pinned
                    ? '#e8f0fe'
                    : 'rgba(255,255,255,0.55)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                textAlign: 'right',
              }}
            >
              {item.label}
            </span>

            {/* מנעול */}
            {item.locked && (
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
                🔒
              </span>
            )}
          </button>
        );
      })}
    </div>,
    document.body,
  );
}

/** חלק עליון — כל יכולות המאמץ עם ניהול פינים */
export function SideMenuRoleSection({
  effortLabel,
  effortItems,
  roleItems,
  onNavClick,
}: Props) {
  const { session } = useAppSession();
  const allItems = [...effortItems, ...roleItems];

  const [pinnedIds, setPinnedIds] = useState<Set<SidebarNavItemId>>(() => {
    const stored = loadPinnedIds(session.userId, session.activeEffort);
    return stored ?? getDefaultPinnedIds(allItems);
  });

  const [manageOpen, setManageOpen] = useState(false);
  const manageBtnRef = useRef<HTMLButtonElement>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  // אפס פינים כשמשתמש/מאמץ משתנה
  useEffect(() => {
    const stored = loadPinnedIds(session.userId, session.activeEffort);
    const allIds = [...effortItems, ...roleItems];
    setPinnedIds(stored ?? getDefaultPinnedIds(allIds));
    setManageOpen(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.userId, session.activeEffort]);

  // שמור שינויים
  useEffect(() => {
    savePinnedIds(session.userId, session.activeEffort, pinnedIds);
  }, [pinnedIds, session.userId, session.activeEffort]);

  const togglePin = useCallback((id: SidebarNavItemId) => {
    setPinnedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  function openManage() {
    if (manageBtnRef.current) {
      setAnchorRect(manageBtnRef.current.getBoundingClientRect());
    }
    setManageOpen(o => !o);
  }

  const visibleItems = allItems.filter(i => pinnedIds.has(i.id));

  const renderItem = (item: SidebarNavItemResolved) =>
    item.variant === 'ecosystem' ? (
      <SideMenuEcosystemTabItem
        key={item.id}
        item={item}
        onClick={!item.locked && onNavClick ? () => onNavClick(item.id) : undefined}
      />
    ) : (
      <SideMenuNavItem
        key={item.id}
        item={item}
        onClick={!item.locked && onNavClick ? () => onNavClick(item.id) : undefined}
      />
    );

  return (
    <div
      data-tutorial-id="sidebar-effort-block"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '8px 4px 8px',
        boxSizing: 'border-box',
      }}
    >
      <p style={sectionLabelStyle}>יכולות {effortLabel}</p>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '100%' }}>
        {visibleItems.map(renderItem)}
      </div>

      {/* כפתור ניהול — תחתית הסקשן */}
      <button
        ref={manageBtnRef}
        type="button"
        onClick={openManage}
        title="ניהול קומפוננטות"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 18,
          border: `1px solid ${manageOpen ? 'rgba(76,138,247,0.6)' : 'rgba(255,255,255,0.12)'}`,
          borderRadius: 4,
          background: manageOpen ? 'rgba(76,138,247,0.15)' : 'transparent',
          cursor: 'pointer',
          color: manageOpen ? '#4c8af7' : 'rgba(255,255,255,0.3)',
          fontSize: 10,
          fontFamily: FONT,
          padding: 0,
          lineHeight: 1,
          transition: 'all 0.12s ease',
          marginTop: 2,
        }}
      >
        ···
      </button>

      {manageOpen && anchorRect && (
        <ManagePanel
          allItems={allItems}
          pinnedIds={pinnedIds}
          onToggle={togglePin}
          onClose={() => setManageOpen(false)}
          anchorRect={anchorRect}
        />
      )}
    </div>
  );
}
