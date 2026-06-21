import type { RoleCategory, RoleId } from '../../types/roles';

export const ROLE_DEFAULT_LAYERS: Record<RoleCategory, string[]> = {
  orekh: [],
  oref: [
    'mv-rashi', 'mv-shkhunot-mamone', 'mv-shkhunot-kfufim', 'mv-shkhunot',
    'mv-khruqq', 'mv-hagana', 'mv-oref', 'mv-bkama', 'mv-tamakh', 'mv-ydiot', 'mv-safa',
    'mg-ukhlusiya',
  ],
  agam: [
    'mv-rashi', 'mv-shkhunot-mamone', 'mv-shkhunot-kfufim', 'mv-shkhunot',
    'mv-khruqq', 'mv-hagana', 'mv-oref', 'mv-bkama', 'mv-tamakh', 'mv-ydiot', 'mv-safa',
    'oy-tama-rashi', 'oy-tama-kfufim', 'oy-tama-mamone', 'oy-historyia',
    'sh-idkunim', 'sh-mistanin', 'sh-tashtyot', 'sh-takarkaa',
    'is-tsyakhim',
    'es-matrot',
    'tk-nayad', 'tk-mfakadot', 'tk-kesher',
    'ml-network',
  ],
  modiin: [
    'oy-tama-rashi', 'oy-tama-kfufim', 'oy-tama-mamone', 'oy-historyia',
    'is-tsyakhim',
    'sh-idkunim', 'sh-mistanin', 'sh-tashtyot', 'sh-takarkaa',
  ],
  esh: [
    'is-tsyakhim',
    'es-matrot', 'es-maagar',
    'mv-shkhunot', 'mv-shkhunot-mamone',
    'oy-tama-rashi',
  ],
  tikshuv: [
    'tk-neyakh', 'tk-nayad', 'tk-kesher', 'tk-tashtyot', 'tk-mfakadot',
  ],
  manhala: [
    'mg-minkhatim',
    'ml-network',
    'ml-tashtyot-log',
  ],
};

/** override לפי תפקיד ספציפי (אופציונלי) */
export const ROLE_DEFAULT_LAYERS_BY_ROLE: Partial<Record<RoleId, string[]>> = {};
