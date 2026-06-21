# ארכיטקטורה — מוקאפ מערכת שליטה ובקרה

## שכבות אפליקציה

```
AppProviders
  AppSessionProvider      משתמש, מאמץ, תפקיד, יחידה, אופציית ניסוי
  TutorialProvider        הדרכה אינטראקטיבית (אופציונלי)
  LayerOrganizerProvider  מצב סדרן שכבות
  TahkirUiProvider        מצב תחקור (סיידבר משני, פאנלים, כלי מפה)
       ↓
AppShell                  כותרת, מפה, סיידבר ראשי, כפתורי מפה, תחקור
LayerOrganizer + …        סדרן, ניהוק, תכנון
```

## מונחים

| מונח בקוד | משמעות |
|-----------|--------|
| `TestPersona` | פרסונה לניסוי — מי המשתמש, הרשאותיו, יחידותיו |
| `RoleCategory` / `activeEffort` | **מאמץ** — הבחירה הגלויה למשתמש ב-Mission Plan (אג"ם, תקשוב…) |
| `RoleId` / `activeRoleId` | **תפקיד ייצוגי** — נגזר מהמאמץ; משמש פנימית לשכבות והרשאות עריכה |
| `UnitLevel` | דרג יחידה: `gdud` / `hativa` / `ugda` |
| `ResolvedSidebarUi` | סייד-בר לאחר `resolveSidebarUi(effort, allowedRoles, unitLevel)` |
| `SidebarPins` | קומפוננטות מוצמדות לסיידבר לפי משתמש + מאמץ |

## זרימת בחירת מאמץ

```
Mission Plan (dropdown)
  ↓ בוחר מאמץ (RoleCategory)
AppSessionContext.setActiveEffort()
  ├── activeEffort = מאמץ נבחר
  └── activeRoleId = תפקיד ייצוגי ראשון מורשה במאמץ
         ↓
resolveSidebarUi(effort, allowedRoleIds, unitLevel)
  ├── פריטי מאמץ: תמיד גלויים
  ├── פריטי תפקיד: גלויים לפי דרג; נעולים אם אין הרשאה
  └── SidebarPins: מסנן מה מוצג בפועל
```

**הרשאות סיידבר לפי פריט:**
1. `requiredRoleId` לא זמין בדרג → **מוסתר לחלוטין**
2. זמין בדרג + אין הרשאה → **גלוי נעול** (ניתן לפתיחה ידנית, אבל לא ניתן לכניסה)
3. זמין + יש הרשאה → **רגיל**

## מבנה תיקיות (`src/`)

```
src/
  types/              layers, roles, session, sidebarUi
  data/
    catalog/          layers, users, units
    rules/            roleDefaults, editPermissions, featureVisibility,
                      sidebarMenuRegistry, sidebarUiSpec,
                      tikshuvRoleAccess, tikshuvSidebar, tikshuvNavIcons
    tahkir/           mock לחלונית יצירת תחקיר
  context/
    AppSessionContext.tsx      מאמץ, תפקיד, יחידה, אופציה
    LayerOrganizerContext.tsx
    TahkirUiContext.tsx
    TutorialContext.tsx
  components/
    shell/            AppShell, כותרת, סיידבר, Mission Plan
      sidebar/        SideMenuRoleSection, SideMenuSharedSection, פריטי תפריט
      tahkir/         סיידבר משני, יצירה, ציר זמן
    tutorial/         הדרכה
  utils/
    resolveSidebarUi.ts   ← סיידבר לפי מאמץ + הרשאות + דרג
    sidebarPins.ts        ← ניהול קומפוננטות מוצמדות (localStorage)
    missionPlanRoles.ts   ← תפריט מאמצים ל-Mission Plan
    resolveRoleLayers.ts
    organizerStorage.ts
  assets/figmaAssets.ts
```

## סייד-בר ראשי (2 חלקים)

| חלק | כותרת | תוכן |
|-----|-------|------|
| עליון — יכולות מאמץ | "יכולות [מאמץ]" | כל קומפוננטות המאמץ; חלקן נעולות לפי הרשאה/דרג |
| תחתון — כלים משותפים | "כלים משותפים" | עץ ציוות, תחקיר, פקמ"ב, AI — לכולם |

רישום קומפוננטות: `sidebarMenuRegistry.ts` · פריטים לפי מאמץ: `sidebarUiSpec.ts`

קומפוננטות תקשוב (תת-סיידבר ICT): `data/rules/ictSubNav.ts`

## שמירה ב-localStorage

| מפתח | תוכן |
|------|------|
| `app-current-user-id` | משתמש נוכחי |
| `app-session-v2-{userId}` | `activeEffort`, `unitId`, `studyOption` |
| `sidebar-pins-v1-{userId}-{effort}` | קומפוננטות מוצמדות לסיידבר |
| `layer-organizer-v3-{userId}--{unitId}` | מצב סדרן (שכבות, תיקיות, עיניים) |

> מצב תחקור **לא** נשמר בין רענונים.

## ברירת מחדל מרשמים לפי תפקיד

מוגדר ב-`src/data/rules/roleDefaults.ts`; נגזר ב-`resolveRoleLayers.ts`.  
**החלפת מאמץ לא מאפסת** את הסדרן — הסדרן שמור לפי `userId + unitId`.  
איפוס ידני: כפתור **↺** ב-`NihukModal`.

## Figma

- קובץ: אקוסיסטם ציד (`a09rJHJ69LA4ofFBb70l3E`)
- אייקונים: `public/assets/figma/` + `src/assets/figmaAssets.ts`
- MCP: `.cursor/mcp.json` (Figma Desktop, פורט 3845)

## קישורים

| נושא | מסמך |
|------|------|
| הדרכה אינטראקטיבית | [TUTORIAL.md](./TUTORIAL.md) |
| תחקור | [TAHKIR.md](./TAHKIR.md) |
| סדרן שכבות | [PRINCIPLES.md](./PRINCIPLES.md) |
| PRD לפי מאמץ | [PRD_AGAM](./PRD_AGAM.md) · [PRD_MODIIN](./PRD_MODIIN.md) · [PRD_ESH](./PRD_ESH.md) · [PRD_TIKSHUV](./PRD_TIKSHUV.md) · [PRD_MANHALA](./PRD_MANHALA.md) |
