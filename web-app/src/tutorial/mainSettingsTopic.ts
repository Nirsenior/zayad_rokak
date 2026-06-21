import type { TutorialTopic } from './types';

/** משתמש ותפקיד לדמו בסיידבר אג"ם (ניהול מערכת + ניהול תוכנית) */
export const TUTORIAL_DEMO_USER_ID = 'general';
export const TUTORIAL_DEMO_ROLE_ID = 'nihul-maarechet';

/** הדרכה תכליתית — להצגה (PowerPoint), לא מדריך משתמש מלא */
export const MAIN_SETTINGS_TOPIC: TutorialTopic = {
  id: 'main-settings',
  label: 'הגדרות ראשיות',
  steps: [
    {
      id: 'user-card',
      title: 'USER',
      bodyParts: ['משתמש + יחידה ← קובעות תפקידים לפי הרשאות.'],
      targetId: 'header-user-button',
      prepare: 'main-settings-base',
    },
    {
      id: 'user-unit-fields',
      title: 'משתמש · יחידה',
      bodyParts: ['בחירה בפאנל ההגדרות.'],
      targetIds: ['user-settings-user', 'user-settings-unit'],
      prepare: 'open-user-settings',
    },
    {
      id: 'role-selection',
      title: 'בחירת תפקיד',
      bodyParts: [
        'תפקיד פעיל ← קובע את ה-sidebar.',
        'כל משתמש יראה את כל התפקידים במאמץ שהוגדר לו — גם אם נעולים.',
        'תפקיד במאמץ אחר שלא פתוח לו — לא יוצג.',
      ],
      targetId: 'mission-plan-dropdown',
      prepare: 'open-mission-plan',
    },
    {
      id: 'sidebar-effort',
      title: 'sidebar · מאמץ',
      bodyParts: [
        'דוגמה: ',
        { kind: 'layer', label: 'ניהול מערכת' },
        ' — קומפוננטות משותפות לכל אג"ם (ת. קרב, סנכרון מאמצים, תמ"כ).',
      ],
      targetId: 'sidebar-effort-block',
      prepare: 'demo-agam-system-admin',
    },
    {
      id: 'sidebar-role',
      title: 'sidebar · תפקיד',
      bodyParts: [
        'מתחת לקו — קומפוננטת ',
        { kind: 'layer', label: 'ניהול תוכנית' },
        ' (רק בתפקיד ניהול מערכת).',
      ],
      targetId: 'sidebar-role-block',
      prepare: 'demo-agam-system-admin',
    },
    {
      id: 'sidebar-bottom',
      title: 'sidebar · תחתון',
      bodyParts: ['משותף לכל המאמצים והתפקידים.'],
      targetId: 'sidebar-bottom-section',
      prepare: 'demo-agam-system-admin',
    },
  ],
};
