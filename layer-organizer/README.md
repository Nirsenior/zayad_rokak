# סדרן שכבות — Layer Organizer

מוקאפ חי למערכת שליטה ובקרה: מעטפת מערכת (משתמש, תפקיד, יחידה) + סדרן שכבות.

## הרצה

```bash
npm install
npm run dev
```

פתח: http://localhost:5173

```bash
npm run build    # בנייה
npm run preview  # תצוגה מקומית של dist
npm start        # שרת production (אחרי build)
```

---

## תיעוד

| מסמך | תיאור |
|------|--------|
| [docs/README.md](./docs/README.md) | אינדקס תיעוד |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | ארכיטקטורה, קונטקסטים, מונחים |
| [docs/PRINCIPLES.md](./docs/PRINCIPLES.md) | עקרונות ופיצ'רים של סדרן השכבות |
| [docs/TUTORIAL.md](./docs/TUTORIAL.md) | הדרכה אינטראקטיבית (?), נושאים ושלבים |
| [docs/ROLE_DESIGN_SYSTEM.md](./docs/ROLE_DESIGN_SYSTEM.md) | סייד-בר לפי תפקיד/מאמץ |
| [docs/TAHKIR.md](./docs/TAHKIR.md) | זרימת תחקור (סיידבר משני, מפה) |
| [deploy/README.md](./deploy/README.md) | פריסה ל-Railway |

---

## מבנה שורש הפרויקט

```
layer-organizer/
├── README.md              ← אתם כאן
├── docs/                  ← תיעוד (ארכיטקטורה, עקרונות)
├── deploy/                ← railway.json (פריסה)
├── .cursor/mcp.json       ← חיבור Figma MCP (Cursor)
├── src/                   ← קוד האפליקציה
├── index.html             ← כניסת Vite (חייב בשורש)
├── package.json           ← npm (חייב בשורש)
├── vite.config.ts
├── tsconfig.json
└── tsconfig.node.json
```

**למה JSON נשארים בשורש?**  
`package.json`, `tsconfig*.json` — דרישת npm / TypeScript / Vite. אי אפשר להזיז בלי לשבור build.

**מה הוזז מהשורש:**  
`.mcp.json` → `.cursor/mcp.json` · `railway.json` → `deploy/railway.json` · מסמכי MD → `docs/`

---

## מבנה קוד (`src/`)

```
src/
├── types/                 layers, roles, session
├── data/
│   ├── catalog/           layers, users, units
│   └── rules/             roleDefaults, sidebarMenuRegistry, sidebarUiSpec, …
├── context/
│   ├── AppSessionContext.tsx      משתמש, תפקיד, יחידה, אופציית ניסוי
│   ├── LayerOrganizerContext.tsx  מצב סדרן
│   ├── TahkirUiContext.tsx        מצב תחקור
│   ├── TutorialContext.tsx        הדרכה אינטראקטיבית
│   └── AppProviders.tsx
├── components/
│   ├── shell/             מעטפת (כותרת, מפה, סרגל)
│   ├── tutorial/          הדרכה (חלונית, spotlight)
│   └── …                  סדרן שכבות
└── utils/
```

---

## עריכת הסדרן

**קובץ ראשי:** `src/data/catalog/layers.ts`  
(נתיב ישן `src/data/layerData.ts` — re-export בלבד)

### שדות שכבה (תמצית)

| שדה | ערכים / משמעות |
|-----|----------------|
| `visibility` | `techno-tactical` · `tactical-hq` · `hq-only` |
| `sharing` | `unit` · `brigade` · `pool` · `null` |
| `isPermanent` | `true` = תמיד בסדרן |
| `isInOrganizer` | מופיע כרגע בסדרן |

פרטים מלאים: [docs/PRINCIPLES.md](./docs/PRINCIPLES.md)

---

## מבנה עץ הסדרן (תמצית)

```
ניהו"ק → לחימה, מבצעים, אויב, איסוף, אש, שטח, תקשוב, מנהלה, מאגרים, טיוטה
תכנון → תוכניות
מרשמי פלוגות → מרשמים
```

---

## Figma MCP

חיבור ל-Figma Desktop: `.cursor/mcp.json` (שרת מקומי `localhost:3845`).  
Figma צריך להיות פתוח בזמן פיתוח כדי לטעון אייקונים מ-`src/assets/figmaAssets.ts`.
