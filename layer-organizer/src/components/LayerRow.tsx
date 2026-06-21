import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Layer } from '../types';
import { useLayerOrganizer } from '../context/LayerOrganizerContext';
import { useAppSession } from '../context/AppSessionContext';
import { EDIT_PERMISSIONS } from '../data/editPermissions';
import {
  canOpenPlanningEntityEditor,
  getPlanningEditSuffix,
} from '../data/rules/planningEditEntities';
import {
  TUTORIAL_MIVTZAIM_LAYER_ID,
  TUTORIAL_OYEV_LAYER_ID,
  TUTORIAL_SHTAKH_LAYER_ID,
} from '../tutorial/content';

function planningLayerTutorialId(layerId: string): string | undefined {
  if (layerId === TUTORIAL_SHTAKH_LAYER_ID) return 'planning-layer-shtakh-edit';
  if (layerId === TUTORIAL_OYEV_LAYER_ID) return 'planning-layer-oyev-edit';
  if (layerId === TUTORIAL_MIVTZAIM_LAYER_ID) return 'planning-layer-mivtzaim-edit';
  return undefined;
}
import { canRoleEditLayer } from '../utils/layerEditAccess';
import { isLayerEditableInMode, layerEditModeTooltip } from '../utils/layerEditMode';
import { VisibilityBadge } from './VisibilityBadge';
import { SharingBadge } from './SharingBadge';
import { LayerInfoTooltip } from './LayerInfoTooltip';
import { EyeOpenIcon, EyeOffIcon, FilterIcon, EditIcon, DragIcon, LockIcon } from './Icons';

interface Props {
  layer: Layer;
  mainFolderId: string;
  subFolderId: string | null;
}

export function LayerRow({ layer, mainFolderId, subFolderId }: Props) {
  const { toggleLayerVisibility, toggleSubFilter, state, openPlanningEdit } = useLayerOrganizer();
  const { session } = useAppSession();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: layer.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : undefined,
  };

  const hasSubFilters = layer.subFilters && layer.subFilters.length > 0;

  const showEditButton = (EDIT_PERMISSIONS[layer.id]?.length ?? 0) > 0;
  const canEditByRole = canRoleEditLayer(layer.id, session.activeRoleId, session.userId);
  const hasEntityEditor = canOpenPlanningEntityEditor(layer.id);
  const canEditInMode = isLayerEditableInMode(mainFolderId, state.mode);
  const canOpenPlanningPanel = canEditByRole && hasEntityEditor && canEditInMode;
  const planningLockedByMode = canEditByRole && hasEntityEditor && !canEditInMode;
  const canEdit = canEditByRole && canEditInMode && !hasEntityEditor;
  const lockedByMode = canEditByRole && !canEditInMode && !hasEntityEditor;
  const modeTooltip = layerEditModeTooltip(mainFolderId, state.mode);
  const showActiveEdit = canOpenPlanningPanel || canEdit;
  const editLockTooltip = planningLockedByMode || lockedByMode
    ? (modeTooltip ?? 'יש לעבור למצב תכנון על מנת לערוך מרשם זה')
    : 'אין הרשאת עריכה — בחר תפקיד מתאים ב-Mission Plan';

  const handlePlanningEditClick = () => {
    if (!canOpenPlanningPanel || !subFolderId) return;
    const suffix = getPlanningEditSuffix(layer.id);
    if (!suffix) return;
    const plan = state.mainFolders
      .find(f => f.id === mainFolderId)
      ?.subFolders.find(sf => sf.id === subFolderId);
    if (!plan) return;
    openPlanningEdit({
      layerId: layer.id,
      layerName: layer.name,
      planName: plan.name,
      suffix,
    });
  };

  return (
    <div ref={setNodeRef} style={style}>
      {/* main row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '5px 8px 5px 10px',
          direction: 'rtl',
          borderBottom: hasSubFilters ? 'none' : '1px solid var(--ds-organizer-border)',
          background: isDragging ? 'var(--ds-organizer-hover)' : 'transparent',
          transition: 'background 0.15s',
          minHeight: 'var(--ds-org-row-min-h)',
        }}
        onMouseEnter={e => { if (!isDragging) (e.currentTarget as HTMLElement).style.background = 'var(--ds-organizer-hover)'; }}
        onMouseLeave={e => { if (!isDragging) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
      >
        {/* drag handle */}
        <span
          {...listeners}
          {...attributes}
          style={{ cursor: 'grab', color: '#2a4060', flexShrink: 0, userSelect: 'none', padding: '0 1px', display: 'flex', alignItems: 'center' }}
          title="גרור לשינוי סדר"
        >
          <DragIcon size={16} color="var(--ds-text-muted)" />
        </span>

        {/* visibility toggle */}
        <button
          onClick={() => toggleLayerVisibility(mainFolderId, subFolderId, layer.id)}
          title={layer.isVisible ? 'הסתר שכבה' : 'הצג שכבה'}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', flexShrink: 0, display: 'flex', alignItems: 'center' }}
        >
          {layer.isVisible
            ? <EyeOpenIcon size={18} color={layer.color} />
            : <EyeOffIcon size={18} color={layer.color} />
          }
        </button>

        {/* layer name — clickable to toggle sub-filters */}
        <span
          onClick={hasSubFilters ? () => setFiltersOpen(o => !o) : undefined}
          style={{
            flex: 1, fontSize: 'var(--ds-org-text-base)',
            color: layer.isVisible ? 'var(--ds-text-primary)' : 'var(--ds-text-muted)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            cursor: hasSubFilters ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-start',
          }}
        >
          {layer.name}
          {hasSubFilters && (
            <span style={{
              fontSize: 'var(--ds-org-text-xs)', color: 'var(--ds-text-muted)', flexShrink: 0,
              display: 'inline-block',
              transform: filtersOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
              transition: 'transform 0.15s',
            }}>▼</span>
          )}
        </span>

        {/* filter button — only when visible and no subFilters */}
        {layer.isVisible && !hasSubFilters && (
          <button
            title="אפשרויות סינון (בקרוב)"
            style={{ background: 'none', border: '1px solid var(--ds-organizer-border)', borderRadius: 3, cursor: 'pointer', padding: '4px 7px', flexShrink: 0, display: 'flex', alignItems: 'center' }}
          >
            <FilterIcon size={14} color="var(--ds-text-muted)" />
          </button>
        )}

        {/* edit button — הרשאה + מצב ניהו"ק/תכנון */}
        {showEditButton && (
          showActiveEdit
            ? (
              <button
                type="button"
                data-tutorial-id={planningLayerTutorialId(layer.id)}
                title="ערוך שכבה"
                onClick={canOpenPlanningPanel ? handlePlanningEditClick : undefined}
                disabled={!canOpenPlanningPanel && !canEdit}
                style={{
                  background: 'none',
                  border: '1px solid var(--ds-organizer-border)',
                  borderRadius: 3,
                  cursor: 'pointer',
                  padding: '4px 7px',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <EditIcon size={15} color="var(--ds-text-secondary)" />
              </button>
            ) : (
              <span
                data-tutorial-id="organizer-layer-edit-lock"
                title={editLockTooltip}
                style={{
                  padding: '4px 7px',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  opacity: canEditByRole ? 0.65 : 0.4,
                }}
              >
                <LockIcon size={14} color="var(--ds-text-muted)" />
              </span>
            )
        )}

        {session.studyOption === 1 ? (
          <>
            <VisibilityBadge level={layer.visibility} />
            <SharingBadge mode={layer.sharing} />
          </>
        ) : (
          <LayerInfoTooltip layer={layer} />
        )}
      </div>

      {/* sub-filters row — collapsible */}
      {hasSubFilters && filtersOpen && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4,
            padding: '4px 10px 6px 8px',
            direction: 'rtl',
            borderBottom: '1px solid var(--ds-organizer-border)',
            background: 'var(--ds-organizer-header)',
          }}
        >
          {layer.subFilters!.map(sf => (
            <button
              key={sf.id}
              onClick={() => toggleSubFilter(mainFolderId, subFolderId, layer.id, sf.id)}
              title={sf.label}
              style={{
                padding: '4px 10px',
                borderRadius: 10,
                border: `1px solid ${sf.isActive ? layer.color + '99' : 'var(--ds-organizer-border)'}`,
                background: sf.isActive ? `${layer.color}25` : 'none',
                cursor: 'pointer',
                fontSize: 'var(--ds-org-text-sm)',
                fontWeight: sf.isActive ? 600 : 400,
                color: sf.isActive ? layer.color : 'var(--ds-text-muted)',
                fontFamily: 'inherit',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {sf.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
