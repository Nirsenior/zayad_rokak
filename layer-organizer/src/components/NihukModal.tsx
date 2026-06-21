import { useState } from 'react';
import type React from 'react';
import { useLayerOrganizer } from '../context/LayerOrganizerContext';
import { VisibilityBadge } from './VisibilityBadge';
import { SharingBadge } from './SharingBadge';

const DRAFT_SUBFOLDER_ID = 'siyuta';

export function NihukModal() {
  const { state, closeNihukModal, toggleLayerInOrganizer, createDraftLayer, deleteDraftLayer, resetNihukToDefault, addAllNihukToOrganizer } = useLayerOrganizer();
  const [newName, setNewName] = useState('');

  const btnStyle: React.CSSProperties = {
    background: 'none', border: '1px solid #1e3a5f', borderRadius: 4,
    cursor: 'pointer', padding: '4px 6px', color: '#4a7090',
    display: 'flex', alignItems: 'center', gap: 3, transition: 'all 0.15s',
  };
  const applyHover = (e: React.MouseEvent, color: string) => {
    (e.currentTarget as HTMLElement).style.borderColor = color;
    (e.currentTarget as HTMLElement).style.color = color;
  };
  const resetHover = (e: React.MouseEvent) => {
    (e.currentTarget as HTMLElement).style.borderColor = '#1e3a5f';
    (e.currentTarget as HTMLElement).style.color = '#4a7090';
  };

  if (!state.nihukModalOpen) return null;

  const nihuk = state.mainFolders.find(f => f.id === 'nihuk');
  if (!nihuk) return null;

  const subFolderId = state.nihukModalSubFolder;
  const subFolders = subFolderId
    ? nihuk.subFolders.filter(sf => sf.id === subFolderId)
    : nihuk.subFolders;

  const title = subFolderId
    ? (nihuk.subFolders.find(sf => sf.id === subFolderId)?.name ?? 'ניהו"ק')
    : 'ניהו"ק — כל השכבות';

  function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    createDraftLayer(trimmed);
    setNewName('');
  }

  return (
    <>
      {/* overlay */}
      <div
        onClick={closeNihukModal}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000 }}
      />

      {/* modal */}
      <div
        data-tutorial-id="organizer-add-modal"
        style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(420px, calc(100vw - 16px))', maxHeight: '80vh',
        background: '#0a1628',
        border: '1px solid #1e3a5f',
        borderRadius: 8,
        boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
        zIndex: 1001,
        display: 'flex', flexDirection: 'column',
        direction: 'rtl',
        fontFamily: "'Heebo', Arial, sans-serif",
      }}>
        {/* header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid #1e3a5f',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#7ab3d4' }}>{title}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>

            {/* הוסף הכל — ריבוע עם וי */}
            <button
              onClick={() => addAllNihukToOrganizer(subFolderId ?? undefined)}
              title="הוסף את כל השכבות לסדרן"
              style={btnStyle}
              onMouseEnter={e => applyHover(e, '#22c55e')}
              onMouseLeave={resetHover}
            >
              <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                <polyline points="3,7.5 5.5,10 11,4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* ברירת מחדל — חץ לאחור */}
            <button
              onClick={() => resetNihukToDefault(subFolderId ?? undefined)}
              title="החזר למצב ברירת מחדל לפי תפקיד"
              style={btnStyle}
              onMouseEnter={e => applyHover(e, '#3b82f6')}
              onMouseLeave={resetHover}
            >
              <span style={{ fontSize: 14, lineHeight: 1 }}>↺</span>
            </button>

            {/* הוספה ממפית — פלייסהולדר */}
            <button
              title="הוספת שכבות ממפית (בקרוב)"
              style={btnStyle}
            >
              <svg width="13" height="15" viewBox="0 0 13 15" fill="none">
                <path d="M6.5 1C4.3 1 2.5 2.8 2.5 5C2.5 8.2 6.5 14 6.5 14C6.5 14 10.5 8.2 10.5 5C10.5 2.8 8.7 1 6.5 1Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                <line x1="6.5" y1="3.5" x2="6.5" y2="6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                <line x1="5" y1="5" x2="8" y2="5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.3 }}>M</span>
            </button>

            {/* סגור */}
            <button
              onClick={closeNihukModal}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3a6080', fontSize: 18, lineHeight: 1, padding: '2px 4px' }}
            >✕</button>
          </div>
        </div>

        {/* content */}
        <div style={{ overflowY: 'auto', padding: '8px 0' }}>
          {subFolders.map((sf, si) => {
            const isDraftSection = sf.id === DRAFT_SUBFOLDER_ID;

            return (
              <div key={sf.id}>
                {/* sub-folder header */}
                {!subFolderId && (
                  <div style={{
                    padding: '6px 16px 4px',
                    fontSize: 10, fontWeight: 700,
                    color: isDraftSection ? '#a855f7' : '#3b82f6',
                    letterSpacing: 0.5,
                    borderTop: si > 0 ? '1px solid #0d1f38' : 'none',
                    marginTop: si > 0 ? 4 : 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span>{sf.name}</span>
                    {/* תג "טיוטה" */}
                    {isDraftSection && (
                      <span style={{ fontSize: 8, color: '#6d28d9', border: '1px solid #6d28d933', borderRadius: 3, padding: '1px 5px' }}>
                        ניתן ליצירה ומחיקה
                      </span>
                    )}
                  </div>
                )}

                {/* layers */}
                {sf.layers.map(layer => {
                  const locked = layer.isPermanent;
                  const isDraft = isDraftSection && !locked;
                  return (
                    <div
                      key={layer.id}
                      onMouseEnter={e => { if (!locked) (e.currentTarget as HTMLElement).style.background = '#0f1f3a'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '5px 16px',
                        cursor: locked ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {/* checkbox / locked */}
                      <span
                        onClick={() => !locked && toggleLayerInOrganizer(layer.id)}
                        style={{
                          width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                          border: locked
                            ? '1.5px solid #2a4060'
                            : `1.5px solid ${layer.isInOrganizer ? layer.color : '#2a4060'}`,
                          background: locked ? '#1a3050' : layer.isInOrganizer ? layer.color + '33' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: locked ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {locked
                          ? <span style={{ fontSize: 8, color: '#4a7090', lineHeight: 1 }}>🔒</span>
                          : layer.isInOrganizer && <span style={{ color: layer.color, fontSize: 10, lineHeight: 1 }}>✓</span>
                        }
                      </span>

                      {/* name */}
                      <span
                        onClick={() => !locked && toggleLayerInOrganizer(layer.id)}
                        style={{ fontSize: 12, flex: 1, color: locked ? '#2a5070' : layer.isInOrganizer ? '#c8d8f0' : '#3a5070' }}
                      >
                        {layer.name}
                      </span>

                      {/* badges — visibility + sharing */}
                      <VisibilityBadge level={layer.visibility} />
                      <SharingBadge mode={layer.sharing} />

                      {/* locked label OR draft delete button */}
                      {locked && (
                        <span style={{ fontSize: 9, color: '#2a4060', flexShrink: 0 }}>קבוע</span>
                      )}
                      {isDraft && (
                        <button
                          onClick={e => { e.stopPropagation(); deleteDraftLayer(layer.id); }}
                          title="מחק שכבת טיוטה"
                          style={{
                            background: 'none',
                            border: '1px solid #ef444433',
                            borderRadius: 3,
                            cursor: 'pointer',
                            padding: '1px 6px',
                            fontSize: 10,
                            color: '#ef4444',
                            flexShrink: 0,
                            lineHeight: 1.4,
                            fontFamily: 'inherit',
                          }}
                          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#ef444418')}
                          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'none')}
                        >
                          מחק
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* create draft layer — only in draft section */}
                {isDraftSection && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 16px 6px',
                    borderTop: '1px solid #0d1f38',
                    marginTop: 4,
                  }}>
                    <input
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCreate()}
                      placeholder="שם שכבת טיוטה חדשה..."
                      style={{
                        flex: 1,
                        background: '#07111f',
                        border: '1px solid #1e3a5f',
                        borderRadius: 4,
                        padding: '5px 8px',
                        fontSize: 11,
                        color: '#c8d8f0',
                        fontFamily: 'inherit',
                        direction: 'rtl',
                        outline: 'none',
                      }}
                      onFocus={e => ((e.target as HTMLInputElement).style.borderColor = '#a855f7')}
                      onBlur={e => ((e.target as HTMLInputElement).style.borderColor = '#1e3a5f')}
                    />
                    <button
                      onClick={handleCreate}
                      disabled={!newName.trim()}
                      style={{
                        background: newName.trim() ? '#6d28d9' : '#1a3050',
                        border: 'none',
                        borderRadius: 4,
                        padding: '5px 12px',
                        cursor: newName.trim() ? 'pointer' : 'not-allowed',
                        fontSize: 11,
                        fontWeight: 600,
                        color: newName.trim() ? '#fff' : '#2a4060',
                        fontFamily: 'inherit',
                        flexShrink: 0,
                        transition: 'all 0.15s',
                      }}
                    >
                      + צור
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
