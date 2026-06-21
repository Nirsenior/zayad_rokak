import { useState } from 'react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { SubFolder, Layer } from '../types';
import { useLayerOrganizer } from '../context/LayerOrganizerContext';
import { LayerRow } from './LayerRow';

interface Props {
  subFolder: SubFolder;
  mainFolderId: string;
  showAddButton?: boolean;
}

export function SubFolderSection({ subFolder, mainFolderId, showAddButton }: Props) {
  const { toggleSubFolder, reorderLayersInSub, isLayerVisibleInFilter, openNihukModal } = useLayerOrganizer();
  const [activeLayer, setActiveLayer] = useState<Layer | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragStart(event: DragStartEvent) {
    const layer = subFolder.layers.find(l => l.id === event.active.id);
    if (layer) setActiveLayer(layer);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveLayer(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = subFolder.layers.findIndex(l => l.id === active.id);
    const newIdx = subFolder.layers.findIndex(l => l.id === over.id);
    if (oldIdx !== -1 && newIdx !== -1) reorderLayersInSub(mainFolderId, subFolder.id, oldIdx, newIdx);
  }

  const visibleLayers = subFolder.layers.filter(l => l.isInOrganizer && isLayerVisibleInFilter(l));

  return (
    <div style={{ borderBottom: '1px solid var(--ds-organizer-border)' }}>
      <button
        data-tutorial-id={`organizer-sub-${subFolder.id}`}
        onClick={() => toggleSubFolder(mainFolderId, subFolder.id)}
        style={{
          display: 'flex', alignItems: 'center', width: '100%',
          padding: '7px 12px 7px 8px', background: 'none', border: 'none',
          cursor: 'pointer', direction: 'rtl', gap: 6,
        }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--ds-organizer-hover)')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'none')}
      >
        {(() => {
          const nameColor = subFolder.layers[0]?.color ?? '#7ab3d4';
          return (
            <>
              <span style={{ color: nameColor + 'aa', fontSize: 'var(--ds-org-text-xs)', display: 'inline-block', transform: subFolder.isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s' }}>▼</span>
              <span style={{ flex: 1, textAlign: 'right', fontSize: 'var(--ds-org-text-sm)', fontWeight: 600, color: nameColor, letterSpacing: 0.3 }}>
                {subFolder.name}
              </span>
            </>
          );
        })()}
        <span style={{ fontSize: 'var(--ds-org-text-sm)', color: 'var(--ds-text-muted)' }}>
          {subFolder.layers.filter(l => l.isInOrganizer).length}/{subFolder.layers.length}
        </span>

        {showAddButton && (
          <span
            onClick={e => { e.stopPropagation(); openNihukModal(subFolder.id); }}
            title={`הוספת שכבות — ${subFolder.name}`}
            style={{
              fontSize: 'var(--ds-org-text-md)', fontWeight: 700, color: '#1e6fa8', lineHeight: 1,
              padding: '0 6px', cursor: 'pointer', flexShrink: 0,
              display: 'flex', alignItems: 'center',
            }}
          >+</span>
        )}
      </button>

      {subFolder.isExpanded && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <SortableContext items={subFolder.layers.map(l => l.id)} strategy={verticalListSortingStrategy}>
            <div style={{ paddingRight: 12 }}>
              {subFolder.layers.map(layer =>
                layer.isInOrganizer && isLayerVisibleInFilter(layer) ? (
                  <LayerRow key={layer.id} layer={layer} mainFolderId={mainFolderId} subFolderId={subFolder.id} />
                ) : null
              )}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeLayer && (
              <div style={{ padding: '4px 8px', background: 'var(--ds-organizer-header)', border: '1px solid var(--ds-organizer-border)', borderRadius: 4, fontSize: 'var(--ds-org-text-base)', color: 'var(--ds-text-primary)', direction: 'rtl', boxShadow: 'var(--ds-shadow-panel)' }}>
                {activeLayer.name}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
