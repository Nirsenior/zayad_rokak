# פריסה (Railway)

קובץ `railway.json` נמצא כאן (לא בשורש הפרויקט) כדי לצמצם קבצים בשורש.

**Railway** מזהה אוטומטית רק `railway.json` **בשורש המאגר**. לפני פריסה:

- העתק `deploy/railway.json` לשורש, או
- הגדר ב-Railway את נתיב קובץ התצורה (אם נתמך בחשבון שלך).

## פקודות

- **build:** `npm install && npm run build`
- **start:** `npm start` → הגשת `dist/` (SPA)

## HTTPS

Railway מספק **TLS אוטומטי** לדומיין `*.up.railway.app` ולדומיין מותאם.
