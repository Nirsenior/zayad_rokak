import type { TestPersona } from '../../types/session';
import { ALL_ROLE_IDS } from '../../types/roles';
import { ALL_UNIT_IDS } from './units';
import { TIKSHUV_ROLE_IDS, isRoleAllowedAtUnit } from '../rules/tikshuvRoleAccess';
import type { UnitLevel } from '../../types/session';

/** כל תפקידים שזמינים ברמת יחידה מסוימת */
function rolesForLevel(level: UnitLevel): string[] {
  return ALL_ROLE_IDS.filter(id => {
    if (TIKSHUV_ROLE_IDS.includes(id as never)) {
      return isRoleAllowedAtUnit(id as never, level);
    }
    return true;
  });
}

const GDUD_ROLES = ['guest', ...rolesForLevel('gdud')] as const;
const HATIVA_ROLES = ['guest', ...rolesForLevel('hativa')] as const;
const UGDA_ROLES = ['guest', ...rolesForLevel('ugda')] as const;

export const TEST_PERSONAS: TestPersona[] = [
  {
    id: 'general',
    name: 'משתמש כללי לדוגמא',
    description: 'כל ההרשאות',
    unitPermissions: [
      { unitId: 'gdud-7020',  allowedRoleIds: [...GDUD_ROLES] as string[] as any },
      { unitId: 'hativa-5',   allowedRoleIds: [...HATIVA_ROLES] as string[] as any },
      { unitId: 'ugda-162',   allowedRoleIds: [...UGDA_ROLES] as string[] as any },
    ],
    defaultUnitId: 'gdud-7020',
  },
  {
    id: 'shalom',
    name: 'שלום',
    description: 'מנלח',
    unitPermissions: [
      { unitId: 'hativa-5',   allowedRoleIds: ['guest', 'agam-rashi'] },
      { unitId: 'ugda-162',   allowedRoleIds: ['guest', 'agam-rashi'] },
    ],
    defaultUnitId: 'hativa-5',
  },
  {
    id: 'netanel',
    name: 'נתנאל',
    description: 'קצין עורף',
    unitPermissions: [
      { unitId: 'gdud-7020', allowedRoleIds: ['guest', 'oref'] },
    ],
    defaultUnitId: 'gdud-7020',
  },
  {
    id: 'moshe',
    name: 'משה',
    description: 'קמן',
    unitPermissions: [
      { unitId: 'gdud-7020', allowedRoleIds: ['guest', 'modiin-rashi'] },
      { unitId: 'hativa-5',  allowedRoleIds: ['guest', 'modiin-rashi'] },
    ],
    defaultUnitId: 'gdud-7020',
  },
  {
    id: 'moti',
    name: 'מוטי',
    description: 'מס"ח',
    unitPermissions: [
      { unitId: 'ugda-162', allowedRoleIds: ['guest', 'mikhlol-haesh'] },
    ],
    defaultUnitId: 'ugda-162',
  },
  {
    id: 'yosi',
    name: 'יוסי',
    description: 'תקשוב — כל התפקידים',
    unitPermissions: [
      // גדוד: רק תקשוב ראשי
      { unitId: 'gdud-7020',  allowedRoleIds: ['guest', 'tikshuv-rashi'] },
      // חטיבה: תקשוב ראשי + ספקטרום
      { unitId: 'hativa-5',   allowedRoleIds: ['guest', 'tikshuv-rashi', 'spektrum'] },
      // אוגדה: כל תפקידי תקשוב
      { unitId: 'ugda-162',   allowedRoleIds: ['guest', ...TIKSHUV_ROLE_IDS] },
    ],
    defaultUnitId: 'gdud-7020',
  },
  {
    id: 'shlomo',
    name: 'שלמה',
    description: 'קלח',
    unitPermissions: [
      { unitId: 'gdud-7020', allowedRoleIds: ['guest', 'logistika'] },
      { unitId: 'ugda-162',  allowedRoleIds: ['guest', 'logistika'] },
    ],
    defaultUnitId: 'gdud-7020',
  },
];

export const DEFAULT_USER_ID = 'general';

/** @deprecated Use TEST_PERSONAS */
export const USERS = TEST_PERSONAS.map(p => ({
  id: p.id,
  name: p.name,
  role: p.description,
}));
