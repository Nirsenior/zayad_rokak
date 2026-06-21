import type { TutorialTopic } from './types';

export const TAHKIR_MODE_TOPIC: TutorialTopic = {
  id: 'tahkir-mode',
  label: 'מצב תחקור',
  steps: [
    {
      id: 'sidebar-entry',
      title: 'מצב תחקור בסיידבר',
      bodyParts: [
        'בתחתית הסיידבר הראשי מופיע כפתור ',
        { kind: 'layer', label: 'תחקור' },
        '. הכפתור זמין לכל המאמצים — לא תלוי בתפקיד שנבחר.',
      ],
      targetId: 'sidebar-tahkir',
      prepare: 'tahkir-reset',
    },
    {
      id: 'secondary-sidebar',
      title: 'Sidebar תחקור משני',
      bodyParts: [
        'בלחיצה על תחקור נפתח סרגל משני משמאל, והמשתמש נכנס ל"מצב תחקור".',
      ],
      targetId: 'tahkir-parallel-sidebar',
      prepare: 'tahkir-sidebar-open',
    },
    {
      id: 'tahkir-layers',
      title: 'שכבת תחקירים על המפה',
      bodyParts: [
        'כפתור שכבת תחקירים מציג על המפה את התחקירים הקיימים במערכת.',
      ],
      targetId: 'tahkir-layers-toggle',
      prepare: 'tahkir-sidebar-open',
    },
    {
      id: 'secondary-tools',
      title: 'כלי הסרגל המשני',
      bodyParts: [
        'בסרגל המשני: ',
        { kind: 'layer', label: 'ציר זמן' },
        ' — ניווט לאורך זמן (לאסו); ',
        { kind: 'layer', label: 'יצירה' },
        ' — יצירת תחקיר חדש (לאסו); ',
        { kind: 'layer', label: 'תחקור מרחב' },
        ' — תחקור מרחב מבינה מבצעית.',
      ],
      targetIds: ['tahkir-tool-timeline', 'tahkir-tool-create', 'tahkir-tool-space'],
      prepare: 'tahkir-sidebar-with-tools',
    },
    {
      id: 'timeline-panel',
      title: 'ציר זמן',
      bodyParts: [
        'בלחיצה על ',
        { kind: 'layer', label: 'ציר זמן' },
        ' נפתח בתחתית המסך פס זמן לניווט בתחקירים לאורך ציר הזמן.',
      ],
      targetId: 'tahkir-timeline-bar',
      prepare: 'tahkir-timeline-open',
    },
    {
      id: 'create-panel',
      title: 'יצירת תחקיר',
      bodyParts: [
        'בלחיצה על ',
        { kind: 'layer', label: 'יצירה' },
        ' נפתחת חלונית ליצירת תחקיר חדש.',
      ],
      targetId: 'tahkir-create-panel',
      prepare: 'tahkir-create-open',
    },
    {
      id: 'space-lock',
      title: 'תחקור מרחב ונעילת סדרן',
      bodyParts: [
        'בלחיצה על ',
        { kind: 'layer', label: 'תחקור מרחב' },
        ' כפתור סדרן המרשמים ננעל — כדי למנוע בלבול בין מידע עבר (תחקיר) למידע עכשווי (ניהו"ק ותכנון).',
      ],
      targetId: 'layers-toggle',
      prepare: 'tahkir-space-active',
    },
  ],
};
