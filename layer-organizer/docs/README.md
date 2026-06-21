# תיעוד הפרויקט

מוקאפ **סדרן שכבות + מעטפת מערכת שליטה ובקרה** (1920×1080, RTL).

---

## מסמכי מוצר (PRD)

| מסמך | תוכן |
|------|------|
| [PRD_AGAM.md](./PRD_AGAM.md) | מאמץ אג"ם — תפקידים, קומפוננטות, ברירות מחדל |
| [PRD_MODIIN.md](./PRD_MODIIN.md) | מאמץ מודיעין |
| [PRD_ESH.md](./PRD_ESH.md) | מאמץ אש |
| [PRD_TIKSHUV.md](./PRD_TIKSHUV.md) | מאמץ תקשוב — כולל תת-קומפוננטות מלאות |
| [PRD_MANHALA.md](./PRD_MANHALA.md) | מאמץ מנהלה |

## מסמכי פיצ'רים

| מסמך | תוכן |
|------|------|
| [TAHKIR.md](./TAHKIR.md) | תחקור — סיידבר משני, חלוניות, ציר זמן |
| [TUTORIAL.md](./TUTORIAL.md) | הדרכה אינטראקטיבית — מסך בית, נושאים, spotlight |

## מסמכי טכנולוגיה

| מסמך | תוכן |
|------|------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | ארכיטקטורה, data model, זרימת מאמץ, localStorage |
| [PRINCIPLES.md](./PRINCIPLES.md) | סדרן השכבות — מבנה, מצבים, הרשאות |

---

## עריכה מהירה

| נושא | קובץ |
|------|------|
| משתמשים / הרשאות | `src/data/catalog/users.ts` |
| כפתורי סיידבר (תוויות, אייקונים) | `src/data/rules/sidebarMenuRegistry.ts` |
| קומפוננטות לפי מאמץ | `src/data/rules/sidebarUiSpec.ts` · `tikshuvSidebar.ts` |
| הרשאות דרג תקשוב | `src/data/rules/tikshuvRoleAccess.ts` |
| ברירת מחדל שכבות לתפקיד | `src/data/rules/roleDefaults.ts` |
| תוכן הדרכה | `src/tutorial/content.ts` |

## הרצה

```bash
npm install
npm run dev    # http://localhost:5173
npm run build
```
