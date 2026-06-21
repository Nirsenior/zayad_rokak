import React from 'react';
import type { MainFolder, Layer } from '../types';
import { useLayerOrganizer } from '../context/LayerOrganizerContext';
import { SubFolderSection } from './SubFolderSection';
import { LayerRow } from './LayerRow';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { EyeOpenIcon, EyeOffIcon, AddLayerIcon, FilterIcon } from './Icons';
import { DotsMenu } from './DotsMenu';

const FOLDER_COLORS: Record<string, string> = {
  lakhima:          '#ef4444',
  nihuk:            '#3b82f6',
  tikhnun:          '#a855f7',
  'marshme-plugot': '#10b981',
};

function getFolderLayers(folder: MainFolder): Layer[] {
  return [...folder.layers, ...folder.subFolders.flatMap(sf => sf.layers)];
}

interface Props { folder: MainFolder }

export function MainFolderSection({ folder }: Props) {
  const { toggleMainFolder, setFolderSmartEye, setFolderAllLayers, openNihukModal, state, isLayerVisibleInFilter } = useLayerOrganizer();
  const [nihukFilterOpen, setNihukFilterOpen] = React.useState(false);
  const accent = FOLDER_COLORS[folder.id] ?? '#60a5fa';
  const eyeOff = state.folderEyeOff[folder.id] ?? false;
  const isNihuk = folder.id === 'nihuk';

  const allLayers = getFolderLayers(folder);
  const inOrganizerCount = allLayers.filter(l => l.isInOrganizer).length;

  const dotsItems = [
    {
      label: 'הדלק את כל המרשמים',
      icon: '◉',
      onClick: () => setFolderAllLayers(folder.id, true),
    },
    {
      label: 'כבה את כל המרשמים',
      icon: '○',
      onClick: () => setFolderAllLayers(folder.id, false),
    },
  ];

  return (
    <div style={{ borderBottom: '1px solid var(--ds-organizer-border)', marginBottom: 2 }}>
      <div
        data-tutorial-id={`organizer-folder-${folder.id}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          background: `linear-gradient(90deg, ${accent}18 0%, var(--ds-organizer-header) 100%)`,
          borderRight: `3px solid ${accent}`,
          direction: 'rtl',
        }}
      >
        {/* expand + name */}
        <button
          onClick={() => toggleMainFolder(folder.id)}
          style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '8px 10px', background: 'none', border: 'none', cursor: 'pointer', direction: 'rtl', gap: 6 }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = `${accent}14`)}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'none')}
        >
          <span style={{ color: accent, fontSize: 'var(--ds-org-text-sm)', display: 'inline-block', transform: folder.isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}>▼</span>
          <span style={{ fontSize: 'var(--ds-org-text-base)', fontWeight: 700, color: 'var(--ds-text-heading)' }}>📁 {folder.name}</span>
          <span style={{ fontSize: 'var(--ds-org-text-sm)', color: 'var(--ds-text-muted)', marginRight: 2 }}>{inOrganizerCount}/{allLayers.length}</span>
        </button>

        {/* controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingLeft: 6, flexShrink: 0 }}>

          {/* filter button — only ניהו"ק */}
          {isNihuk && (
            <button
              data-tutorial-id="organizer-nihuk-filter"
              onClick={() => setNihukFilterOpen(o => !o)}
              title="סינון שכבות ניהול הקרב"
              style={{
                background: nihukFilterOpen ? 'var(--ds-organizer-hover)' : 'none',
                border: `1px solid ${nihukFilterOpen ? '#3b82f6' : 'var(--ds-organizer-border)'}`,
                borderRadius: 3,
                padding: '4px 7px', cursor: 'pointer',
                display: 'flex', alignItems: 'center',
                color: nihukFilterOpen ? 'var(--ds-text-heading)' : 'var(--ds-text-muted)',
              }}
            >
              <FilterIcon size={16} color={nihukFilterOpen ? 'var(--ds-text-heading)' : 'var(--ds-text-muted)'} />
            </button>
          )}

          {/* smart eye */}
          <button
            onClick={() => setFolderSmartEye(folder.id, !eyeOff)}
            title={eyeOff ? 'שחזר מצב תיקייה' : 'הסתר תיקייה (שמור מצב)'}
            style={{
              background: 'none', border: '1px solid var(--ds-organizer-border)', borderRadius: 3,
              padding: '4px 7px', cursor: 'pointer', display: 'flex', alignItems: 'center',
            }}
          >
            {eyeOff
              ? <EyeOffIcon size={18} color="var(--ds-text-muted)" />
              : <EyeOpenIcon size={18} color="var(--ds-text-heading)" />
            }
          </button>

          {/* dots menu — הדלק/כבה */}
          <DotsMenu items={dotsItems} align="left" />

          {/* add layers — only ניהו"ק */}
          {isNihuk && (
            <button
              data-tutorial-id="organizer-nihuk-add"
              onClick={() => openNihukModal()}
              title={'הוספת שכבות לניהו"ק'}
              style={{
                background: 'none', border: `1px solid ${accent}55`,
                borderRadius: 3, padding: '4px 9px', cursor: 'pointer',
                fontSize: 'var(--ds-org-text-xl)', fontWeight: 700, color: accent, lineHeight: 1,
                display: 'flex', alignItems: 'center', marginLeft: 2,
              }}
            >+</button>
          )}

          {/* add planning prescriptions — only תכנון */}
          {folder.id === 'tikhnun' && (
            <button
              title="הוספת מרשמי תכנון"
              style={{
                background: 'none', border: `1px solid ${accent}55`,
                borderRadius: 3, padding: '4px 9px', cursor: 'pointer',
                fontSize: 'var(--ds-org-text-xl)', fontWeight: 700, color: accent, lineHeight: 1,
                display: 'flex', alignItems: 'center', marginLeft: 2,
              }}
            >+</button>
          )}
        </div>
      </div>

      {/* content */}
      {folder.isExpanded && (
        <div style={{ background: 'var(--ds-organizer-content)' }}>
          {folder.layers.length > 0 && (
            <SortableContext items={folder.layers.map(l => l.id)} strategy={verticalListSortingStrategy}>
              <div style={{ paddingRight: 8, borderBottom: '1px solid var(--ds-organizer-border)' }}>
                {folder.layers.map(layer =>
                  isLayerVisibleInFilter(layer) ? (
                    <LayerRow key={layer.id} layer={layer} mainFolderId={folder.id} subFolderId={null} />
                  ) : null
                )}
              </div>
            </SortableContext>
          )}
          {folder.subFolders.filter(sf =>
            folder.id === 'tikhnun' || sf.layers.some(l => l.isInOrganizer),
          ).map(sf => (
            <SubFolderSection key={sf.id} subFolder={sf} mainFolderId={folder.id} showAddButton={isNihuk} />
          ))}
        </div>
      )}
    </div>
  );
}
