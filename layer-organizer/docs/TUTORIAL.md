# הדרכה אינטראקטיבית

מערכת הדרכה במוקאפ: כפתור **?** בכותרת, חלונית נגררת, סימון סגול על רכיבי UI (ללא האפלה על המסך).

## הפעלה

| פעולה | התנהגות |
|--------|----------|
| **?** בכותרת | פותח **מסך בית** — רשימת נושאים |
| בחירת נושא | נכנסים ל**שיעור**: נושאים בצד + שלבים במרכז |
| **סיום** בשלב האחרון | יוצאים מהשיעור → חוזרים למסך בית |
| **×** או **?** שוב | סוגרים את כל ההדרכה |

במהלך שיעור: לחיצה מחוץ לחלונית **משהה** את הסימון (החלונית נשארת); **הבא** / **הקודם** מחדשים את הסימון.

## נושאים (סדר במסך הבית)

| מזהה | כותרת | קובץ תוכן |
|------|--------|-----------|
| `main-settings` | הגדרות ראשיות | `src/tutorial/mainSettingsTopic.ts` |
| `layer-organizer` | סדרן המרשמים | `src/tutorial/organizerTopic.ts` |
| `advanced-planning` | תכנון מתקדם | `src/tutorial/content.ts` |
| `tahkir-mode` | מצב תחקור | `src/tutorial/tahkirModeTopic.ts` |

רשימה מרוכזת: `TUTORIAL_TOPICS` ב-`src/tutorial/content.ts`.

## ארכיטקטורה

```
TutorialProvider (TutorialContext)
  TutorialHost (portal ל-body)
    TutorialSpotlight      — טבעת סגולה על [data-tutorial-id]
    TutorialInteractionGuard — השהיית סימון בלחיצה מחוץ לחלונית
    TutorialModal
      TutorialHomeScreen   — view: 'home'
      TutorialLessonPanel  — view: 'lesson' + רשימת נושאים בצד
```

| קובץ | תפקיד |
|------|--------|
| `src/context/TutorialContext.tsx` | מצב, שלבים, `prepare`, גשר ל-`AppShell` |
| `src/tutorial/types.ts` | `TutorialTargetId`, `TutorialPrepare`, מבנה שלב |
| `src/components/tutorial/TutorialHost.tsx` | פורטל + spotlight רק ב-`lesson` |
| `src/components/shell/AppShell.tsx` | `registerShellBridge` — סדרן, תחקור, דמו משתמש |
| `src/components/shell/SystemHeader.tsx` | כפתור `?` → `toggleOpen` |

### מצבי תצוגה

- `view: 'home'` — בחירת נושא בלבד, **ללא** spotlight.
- `view: 'lesson'` — שלב פעיל + spotlight לפי `targetId` / `targetIds`.

### הכנת UI (`prepare`)

לפני כל שלב רצים `applyPrepare` ב-`TutorialContext` (למשל פתיחת סדרן, Mission Plan, דמו תפקיד עורף). סוגי הכנה מוגדרים ב-`TutorialPrepare` ב-`types.ts`.

**דמו משתמש בהדרכה:**

| קבוע | שימוש |
|------|--------|
| `TUTORIAL_DEMO_USER_ID` / `TUTORIAL_DEMO_ROLE_ID` | סיידבר אג״ם (הגדרות ראשיות) |
| `TUTORIAL_OREF_USER_ID` (`netanel`) / `TUTORIAL_OREF_ROLE_ID` | ברירת מחדל עורף בסדרן |

לפני דמו עורף נשמר המשתמש/תפקיד הנוכחי; בשלב **תיקייה · תכנון** (הבא) המערכת משחזרת את הסשן.

### סימון רכיבים

כל יעד הדרכה: `data-tutorial-id="…"` ב-DOM. מדידה: `useTutorialTargetRect` (מרווח 10px).

דוגמאות: `layers-toggle`, `organizer-panel`, `organizer-mode-switch`, `mission-plan-button`, `sidebar-effort-block`.

## נושא «סדרן המרשמים» (תמצית)

מבחוץ לפנים:

1. פתיחה מהמפה → מבט כללי → טוגל ניהו"ק/תכנון (רק הטוגל מחליף מצב)
2. פקדים גלובליים + פילטר דרג (**טכנו טקטי** / **מפקדה טקטית** / **מפקדה**)
3. תיקיית ניהו"ק, סינון, תת-תיקיות **לחימה** ו**טיוטה**
4. נעילת עריכה בשורה, חלונית הוספה/הסרה, מרשמים קבועים (🔒)
5. ברירת מחדל לפי תפקיד (`roleDefaults`) + דמו **נתנאל / עורף**
6. תיקיות תכנון ומרשמי פלוגות

פרטי עקרונות הסדרן: [PRINCIPLES.md](./PRINCIPLES.md).

## נושא «הגדרות ראשיות»

USER, יחידה, Mission Plan, סיידבר מאמץ (אג״ם) מול תפקיד (ניהול תוכנית). דמו: משתמש `general` + `nihul-maarechet`.

## נושא «תחקור»

סיידבר תחקור, כלי משני, שכבת תחקירים, ציר זמן, יצירה, תחקור מרחב. פירוט מעטפת: [TAHKIR.md](./TAHKIR.md).

## הוספת שלב / נושא

1. הוסיפו `TutorialTargetId` ו-`TutorialPrepare` ב-`types.ts` (אם נדרש).
2. הגדירו שלבים בקובץ נושא או ב-`content.ts`.
3. רשמו ב-`TUTORIAL_TOPICS`.
4. הוסיפו `data-tutorial-id` לרכיב.
5. הרחיבו `applyPrepare` + גשר `AppShell` אם צריך פעולת מעטפת.

## קישורים

| נושא | מסמך |
|------|--------|
| ארכיטקטורה כללית | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| סדרן שכבות | [PRINCIPLES.md](./PRINCIPLES.md) |
| ברירת מחדל מרשמים | `src/data/rules/roleDefaults.ts` |
| סיידבר לפי תפקיד | [ROLE_DESIGN_SYSTEM.md](./ROLE_DESIGN_SYSTEM.md) |
