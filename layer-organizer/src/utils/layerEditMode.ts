import type { AppMode } from '../types/layers';

const NIHUK_FOLDER_ID = 'nihuk';
const PLANNING_FOLDER_ID = 'tikhnun';

/** האם שכבה שייכת לתיקייה ניתנת לעריכה במצב הנוכחי */
export function isLayerEditableInMode(mainFolderId: string, mode: AppMode): boolean {
  if (mainFolderId === NIHUK_FOLDER_ID) return mode === 'nihuk';
  if (mainFolderId === PLANNING_FOLDER_ID) return mode === 'tikhnun';
  return true;
}

/** הודעת ריחוף כשהמצב הלא נכון לעריכה */
export function layerEditModeTooltip(mainFolderId: string, mode: AppMode): string | null {
  if (mainFolderId === NIHUK_FOLDER_ID && mode === 'tikhnun') {
    return 'בכדי לערוך שכבה זו עבור למצב ניהו"ק';
  }
  if (mainFolderId === PLANNING_FOLDER_ID && mode === 'nihuk') {
    return 'יש לעבור למצב תכנון על מנת לערוך מרשם זה';
  }
  return null;
}
