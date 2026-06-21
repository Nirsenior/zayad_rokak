import type { TutorialTopic } from './types';
import { MAIN_SETTINGS_TOPIC } from './mainSettingsTopic';
import { ORGANIZER_TOPIC } from './organizerTopic';
import { TAHKIR_MODE_TOPIC } from './tahkirModeTopic';

/** מרשמי תכנון לדוגמה — תוכנית שמש אדומה / 7020 */
export const TUTORIAL_SHTAKH_LAYER_ID = 'tk-sa7020-shtakh';
export const TUTORIAL_OYEV_LAYER_ID = 'tk-sa7020-oyev';
export const TUTORIAL_MIVTZAIM_LAYER_ID = 'tk-sa7020-mivtzaim';
export const TUTORIAL_PLAN_SUBFOLDER_ID = 'tokhnit-shemesh-7020';

export const TUTORIAL_PLANNING_LAYER_IDS = [
  TUTORIAL_SHTAKH_LAYER_ID,
  TUTORIAL_OYEV_LAYER_ID,
  TUTORIAL_MIVTZAIM_LAYER_ID,
] as const;

export const TUTORIAL_TOPICS: TutorialTopic[] = [
  MAIN_SETTINGS_TOPIC,
  ORGANIZER_TOPIC,
  {
    id: 'advanced-planning',
    label: 'תכנון מתקדם',
    steps: [
      {
        id: 'open-organizer',
        title: 'לחיצה על סדרן המרשמים',
        targetId: 'layers-toggle',
        prepare: 'none',
      },
      {
        id: 'planning-mode',
        title: 'העברה לתכנון',
        targetId: 'organizer-planning-mode',
        prepare: 'open-organizer',
      },
      {
        id: 'pick-layer-edit',
        title: 'בחירת מרשם לעריכה',
        bodyParts: [
          'בתיקיית תכנון, בחרו תוכנית ולחצו על כפתור העריכה ליד המרשם.',
        ],
        targetIds: [
          'planning-layer-shtakh-edit',
          'planning-layer-oyev-edit',
          'planning-layer-mivtzaim-edit',
        ],
        prepare: 'planning-mode',
      },
      {
        id: 'advanced-shtakh',
        title: 'תכנון שטח מתקדם',
        bodyParts: [
          'בחלון העריכה, לחצו על ',
          { kind: 'planning-btn', label: 'תכנון שטח מתקדם' },
          ' כדי להפעיל תכנון שטח בעזרת AI. לאחר אישור השכבה, עוברים לשכבה הבאה.',
        ],
        targetId: 'advanced-planning-shtakh',
        prepare: 'open-shtakh-edit',
      },
      {
        id: 'advanced-oyev',
        title: 'תכנון אויב מתקדם',
        bodyParts: [
          'לאחר אישור שכבת השטח, פתחו לעריכה את מרשם ',
          { kind: 'layer', label: 'תכנון אויב' },
          ' ולחצו ',
          { kind: 'planning-btn', label: 'תכנון אויב מתקדם' },
          '. ודאו שנספח השטח מעודכן לפני ההפעלה.',
        ],
        targetId: 'advanced-planning-oyev',
        prepare: 'open-oyev-edit',
      },
      {
        id: 'advanced-mivtzaim',
        title: 'תכנון מבצעים ראשי מתקדם',
        bodyParts: [
          'לאחר אישור שכבות השטח והאויב, פתחו ',
          { kind: 'layer', label: 'תכנון מבצעים ראשי' },
          ' ולחצו ',
          { kind: 'planning-btn', label: 'תכנון מבצעים ראשי מתקדם' },
          '. התכנון מתבסס על נספחי השטח והאויב.',
        ],
        targetId: 'advanced-planning-mivtzaim',
        prepare: 'open-mivtzaim-edit',
      },
    ],
  },
  TAHKIR_MODE_TOPIC,
];

export function getTopicById(id: string): TutorialTopic | undefined {
  return TUTORIAL_TOPICS.find(t => t.id === id);
}
