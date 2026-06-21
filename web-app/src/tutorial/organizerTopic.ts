import type { TutorialPrepare, TutorialStep, TutorialTargetId, TutorialTopic } from './types';

/** משתמש נתנאל — דמו ברירת מחדל עורף */
export const TUTORIAL_OREF_USER_ID = 'netanel';
export const TUTORIAL_OREF_ROLE_ID = 'oref';

type NihukSubId = 'lakhima' | 'siyuta';

const NIHUK_SUB: { id: NihukSubId; title: string; body: string }[] = [
  {
    id: 'lakhima',
    title: 'תת-תיקייה · לחימה',
    body: 'שכבות ליבה במבצע — כוחותינו, איתורים, תיאום ושליטה, מבצעים ראשי ותמ"א ראשי. רוב השכבות כאן נעולות בסדרן (🔒) ותמיד מוצגות.',
  },
  {
    id: 'siyuta',
    title: 'תת-תיקייה · שכבות טיוטה',
    body: 'שכבות יחידתיות — רק במפקדה. ניתן ליצור שכבות חדשות ולמחוק טיוטות. לא נשמרות כברירת מחדל בין סשנים.',
  },
];

function nihukSubTarget(id: NihukSubId): TutorialTargetId {
  return `organizer-sub-${id}` as TutorialTargetId;
}

function nihukSubPrepare(id: NihukSubId): TutorialPrepare {
  return `organizer-nihuk-${id}` as TutorialPrepare;
}

function nihukSubStep(sub: { id: NihukSubId; title: string; body: string }): TutorialStep {
  return {
    id: `nihuk-${sub.id}`,
    title: sub.title,
    bodyParts: [sub.body],
    targetId: nihukSubTarget(sub.id),
    prepare: nihukSubPrepare(sub.id),
  };
}

/** הדרכה על סדרן המרשמים — מבחוץ לפנים */
export const ORGANIZER_TOPIC: TutorialTopic = {
  id: 'layer-organizer',
  label: 'סדרן המרשמים',
  steps: [
    {
      id: 'open',
      title: 'פתיחת סדרן המרשמים',
      bodyParts: ['כפתור השכבות על המפה פותח וסוגר את הסדרן.'],
      targetId: 'layers-toggle',
      prepare: 'organizer-close',
    },
    {
      id: 'panel',
      title: 'מבט כללי',
      bodyParts: [
        'שלוש רמות: תיקייה ראשית → תת-תיקייה → מרשם.',
        'מונה X/Y — כמה מרשמים בסדרן מתוך הסך הכל.',
      ],
      targetId: 'organizer-panel',
      prepare: 'organizer-open-nihuk',
    },
    {
      id: 'mode',
      title: 'ניהו"ק / תכנון',
      bodyParts: [
        'מעבר בין מצב ניהו"ק למצב תכנון.',
        'שינוי המצב משפיע על המרשמים שפתוחים לעריכה.',
      ],
      targetId: 'organizer-mode-switch',
      prepare: 'organizer-open-nihuk',
    },
    {
      id: 'global-controls',
      title: 'פקדים גלובליים',
      bodyParts: [
        'עריכה כללית, הוספת קבוצות, פילטר דרג (טכנו טקטי → מפקדה טקטית → מפקדה), תוויות, עין חכמה ותפריט הדלק/כבה לכל המרשמים.',
      ],
      targetIds: [
        'organizer-global-edit',
        'organizer-global-add',
        'organizer-view-level',
        'organizer-global-labels',
        'organizer-global-eye',
        'organizer-global-dots',
      ],
      prepare: 'organizer-open-nihuk',
    },
    {
      id: 'view-level',
      title: 'פילטר דרג צפייה',
      bodyParts: [
        'בחירת דרג נמוך (טכנו טקטי) מציג רק שכבות עד אותו דרג.',
        'בחירת דרג גבוה יותר כוללת גם את הדרגים שמתחתיו — רואים את אותם שכבות ועוד.',
        'מפקדה — רואה הכל. הפילטר מתאפס בכל כניסה למערכת.',
      ],
      targetId: 'organizer-view-level',
      prepare: 'organizer-open-nihuk',
    },
    {
      id: 'folder-nihuk',
      title: 'תיקייה · ניהו"ק',
      bodyParts: [
        'כל שכבות המבצע — תת-תיקיות לפי נושא.',
        'עין תיקייה, תפריט הדלק/כבה, סינון וכפתור + להוספת מרשמים.',
      ],
      targetId: 'organizer-folder-nihuk',
      prepare: 'organizer-open-nihuk',
    },
    {
      id: 'nihuk-filter',
      title: 'סינון ניהו"ק',
      bodyParts: ['סינון וחיפוש בתוך שכבות ניהול הקרב.'],
      targetId: 'organizer-nihuk-filter',
      prepare: 'organizer-open-nihuk',
    },
    ...NIHUK_SUB.map(nihukSubStep),
    {
      id: 'layer-edit-lock',
      title: 'נעילת עריכה בשורה',
      bodyParts: [
        'בשורת מרשם בסדרן: מנעול אפור = אין הרשאת עריכה בתפקיד הנוכחי.',
        'כפתור עריכה פעיל = מותר לערוך את המרשם (במצב המתאים).',
      ],
      targetId: 'organizer-layer-edit-lock',
      prepare: 'organizer-layer-lock-demo',
    },
    {
      id: 'add-modal',
      title: 'הוספה והסרה מהסדרן',
      bodyParts: [
        'כפתור + בתת-תיקייה (או בתיקיית ניהו"ק) פותח חלונית בחירה.',
        'סימון ✓ מוסיף מרשם לסדרן; לחיצה חוזרת מסירה.',
        '↺ מחזיר את מצב התת-תיקייה לברירת המחדל של התפקיד הפעיל.',
      ],
      targetId: 'organizer-add-modal',
      prepare: 'organizer-modal-mivtzaim',
    },
    {
      id: 'locked-layers',
      title: 'מרשמים נעולים',
      bodyParts: [
        'שכבה עם 🔒 (קבועה) — תמיד בסדרן ולא ניתן להסיר מהחלונית.',
      ],
      targetId: 'organizer-add-modal',
      prepare: 'organizer-modal-mivtzaim',
    },
    {
      id: 'role-defaults-intro',
      title: 'ברירת מחדל לפי תפקיד',
      bodyParts: [
        'מנהל המוצר של המאמץ מגדיר ב-roleDefaults אילו מרשמים יופיעו לכל תפקיד.',
        'בחירת תפקיד ב-Mission Plan קובעת הרשאות, עריכה ומה מוצג כברירת מחדל.',
      ],
      targetId: 'mission-plan-button',
      prepare: 'open-mission-plan',
    },
    {
      id: 'role-oref-demo',
      title: 'דוגמה · ברירת מחדל עורף',
      bodyParts: [
        'משתמש נתנאל, תפקיד עורף — מרשמים אחרים בסדרן מאשר באג"ם.',
        '↺ בחלונית ההוספה מחזיר לפי התפקיד הפעיל.',
      ],
      targetId: 'organizer-folder-nihuk',
      prepare: 'organizer-role-oref',
    },
    {
      id: 'folder-tikhnun',
      title: 'תיקייה · תכנון',
      bodyParts: [
        'תוכניות לחימה — תת-תיקייה לכל תוכנית, מרשמי תכנון (שטח, אויב, מבצעים…).',
        'עריכה זמינה במצב תכנון בלבד — מעבר בטוגל בראש הסדרן.',
      ],
      targetId: 'organizer-folder-tikhnun',
      prepare: 'organizer-restore-session-open-tikhnun',
    },
    {
      id: 'folder-plugot',
      title: 'תיקייה · מרשמי פלוגות',
      bodyParts: ['בתיקייה זו יוצגו מרשמי הפלוגות של המסגרות הכפופות.'],
      targetId: 'organizer-folder-plugot',
      prepare: 'organizer-open-plugot',
    },
  ],
};
