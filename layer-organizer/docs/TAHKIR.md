# תחקור — מעטפת UI

זרימת **תחקור** במוקאפ: סיידבר משני מימין, כלים על המפה, חלוניות. מימוש ב-`TahkirUiContext` + `src/components/tahkir/`.

## הפעלה

1. בסיידבר הראשי (תחתון): לחיצה על **תחקור** → `toggleSidebar()`.
2. נפתח **סיידבר משני** (`TahkirParallelSideMenu`) — Figma `393:37071`, רוחב 84px, צמוד לראשי.
3. מופיע כפתור **שכבת תחקירים** מתחת ל**סדרן המרשמים** על המפה.

## סיידבר משני — כלים

| כפתור | פעולה | הערות |
|--------|--------|--------|
| **ציר זמן** | `toggleTimeline` | פס תחתון `TahkirTimelineBar` — Figma `386:90031` |
| **יצירה** | `toggleCreate` | בריחוף: «יצירת תחקיר»; פותח/סוגר חלונית יצירה |
| **תחקור מרחב** | `toggleSpace` | מצב `spaceActive`; נועל פתיחת סדרן מרשמים |

כפתור **קיפול** בראש הסיידבר המשני: `toggleSidebar` (סוגר גם פאנלים).

## חלונית יצירת תחקיר

- רכיב: `TahkirCreatePanel.tsx`
- Figma: `393:30622` (רוחב 412px)
- מיקום: משמאל לסיידבר המשני — `tahkirCreatePanelLeft()`
- סקשנים: פרטים כללים, רצף אירועים, אמצעים
- mock: `src/data/tahkir/tahkirCreatePanelData.ts`

## כפתורי מפה

| כפתור | תנאי תצוגה | התנהגות |
|--------|-------------|----------|
| סדרן המרשמים | תמיד (בעמודת כלים) | `organizerOpen`; **מושבת** ב-`spaceActive` |
| שכבת תחקירים | `sidebarOpen` בתחקור | `toggleTahkirLayer`; מראה לחוץ כמו סדרן (אייקון `tahkir-layers-icon.svg`) |

**מיקום עמודת הכלים:** `layersToggleLeft(mainSidebarOpen, tahkirSidebarOpen, createOpen)` ב-`shellLayout.ts`.

- סיידבר ראשי מקופל → +57px ימינה (`MAIN_MENU_W`).
- סיידבר תחקור / חלונית יצירה פתוחים → הזזה שמאלה בהתאם.

## סגירה מסונכרנת

| אירוע | תוצאה |
|--------|--------|
| קיפול סיידבר ראשי (כותרת) | `closeTahkirChrome()` — סיידבר משני, ציר זמן, יצירה, שכבת תחקירים |
| לחיצה חוזרת על **תחקור** | אותו איפוס + סגירת משני |
| פתיחת **תחקור מרחב** | סוגר חלונית יצירה; סדרן מרשמים ננעל |

## API — `TahkirUiContext`

| שדה / פעולה | תיאור |
|-------------|--------|
| `sidebarOpen` | סיידבר משני פתוח |
| `timelineOpen` | פס ציר זמן |
| `createOpen` | חלונית יצירה |
| `tahkirLayerOpen` | כפתור שכבת תחקירים לחוץ |
| `spaceActive` | תחקור מרחב |
| `activeTool` | `'timeline' \| 'create' \| 'space' \| null` |
| `closeTahkirChrome()` | איפוס מלא + סגירת משני |
| `setSidebarOpen` / `setTimelineOpen` / … | לשימוש הדרכה (Tutorial) |

## קבצים

| קובץ | תפקיד |
|------|--------|
| `context/TahkirUiContext.tsx` | state |
| `components/tahkir/TahkirParallelSideMenu.tsx` | סיידבר משני |
| `components/tahkir/TahkirCreatePanel.tsx` | יצירת תחקיר |
| `components/tahkir/TahkirTimelineBar.tsx` | ציר זמן |
| `components/shell/TahkirLayersToggle.tsx` | כפתור שכבה על מפה |
| `components/shell/shellLayout.ts` | קואורדינטות Figma |
| `components/shell/sidebar/SideMenuSharedSection.tsx` | חיבור כפתור תחקור בראשי |

## הדרכה

נושא **מצב תחקור** במערכת ההדרכה (כפתור **?** בכותרת) — שלבים על סיידבר, כלים וחלוניות. פירוט: [TUTORIAL.md](./TUTORIAL.md).

## Figma (עיקרי)

| Node | תיאור |
|------|--------|
| `393:37071` | סיידבר משני |
| `393:30622` | חלונית יצירה |
| `386:90031` | ציר זמן |
| `392:30648` | אייקון יצירה |
| `393:34791` | תחקור מרחב |
