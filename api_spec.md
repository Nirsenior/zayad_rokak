# מפרט API ומודל נתונים: מערכת רוק״ק טקטי
**מסמך טכני מפורט לפיתוח Backend ואינטגרציה**

---

## 1. מודל הנתונים וישויות המערכת (Data Model)
כל הישויות כוללות מזהים מסוג `UUID v4` ושדות מעקב זמן ומשתמשים: `created_at`, `updated_at`, `created_by` (קישור ל-User ID) ו-`updated_by` (קישור ל-User ID).

### 1.1. User (משתמש מערכת)
מייצג משתמש מורשה במערכת (Web או Android).
* **שדות:**
  * `id`: UUID (חובה) - מפתח ראשי.
  * `username`: String (חובה) - שם משתמש ייחודי (למשל מספר אישי / אימייל).
  * `password_hash`: String (חובה) - סיסמה מוצפנת.
  * `full_name`: String (חובה) - שם מלא.
  * `role`: Enum (חובה) - תפקיד במערכת: `ROKAQ_OFFICER`, `HQ_OPERATOR`, `DIVISION_VIEWER`, `FIELD_OPERATOR`.
  * `created_at` / `updated_at`: Timestamp (חובה).
  * `created_by` / `updated_by`: UUID (אופציונלי - לצורך הגדרת יוזר ראשוני).

### 1.2. Unit (יחידה צבאית)
מייצג את המבנה ההיררכי של הכוחות.
* **שדות:**
  * `id`: UUID (חובה).
  * `name`: String (חובה) - שם היחידה (למשל: "גדוד 51").
  * `parent_unit_id`: UUID (אופציונלי) - קישור ליחידת האם (למשל: "חטיבה 1").
  * `unit_code`: String (חובה) - קוד מזהה יחידתי.
  * `created_at` / `updated_at`: Timestamp (חובה).

### 1.3. OperatorProfile (פרופיל מפעיל שטח)
הרחבה של ישות משתמש עבור מפעילי האול"ר בשטח.
* **שדות:**
  * `id`: UUID (חובה).
  * `user_id`: UUID (חובה) - קשר 1:1 לישות `User`.
  * `unit_id`: UUID (חובה) - קשר לישות `Unit`.
  * `license_number`: String (חובה) - מספר רישיון מטיס צבאי.
  * `status`: Enum (חובה) - סטטוס מפעיל: `ACTIVE`, `SUSPENDED`.
  * `created_at` / `updated_at`: Timestamp (חובה).

### 1.4. Drone (רחפן / כלי טיס)
רישום הכלים המורשים לטיסה במערכת.
* **שדות:**
  * `id`: UUID (חובה).
  * `serial_number`: String (חובה) - מספר סידורי ייחודי של היצרן.
  * `model`: String (חובה) - דגם הכלי (למשל: "DJI Matrice 300").
  * `manufacturer`: String (חובה) - שם היצרן.
  * `owner_unit_id`: UUID (חובה) - קשר לישות `Unit`.
  * `control_frequency`: Float (חובה) - תדר שלט ראשי (ב-GHz, למשל 2.4).
  * `video_frequency`: Float (חובה) - תדר שידור וידאו (ב-GHz, למשל 5.8).
  * `status`: Enum (חובה) - סטטוס כלי: `READY`, `MAINTENANCE`, `LOST`, `DECOMMISSIONED`.
  * `created_at` / `updated_at`: Timestamp (חובה).

### 1.5. FlightRequest (בקשת טיסה)
בקשת המטיס להקצאת מרחב אווירי וחלון זמן.
* **שדות:**
  * `id`: UUID (חובה).
  * `operator_id`: UUID (חובה) - קשר ל-`User` (ספציפית `FIELD_OPERATOR`).
  * `drone_id`: UUID (חובה) - קשר לישות `Drone`.
  * `route`: Geometry LineString (חובה) - נתיב טיסה מתוכנן (נקודות תלת-ממדיות X, Y, Z).
  * `min_altitude_agl`: Float (חובה) - גובה מינימלי במטרים.
  * `max_altitude_agl`: Float (חובה) - גובה מקסימלי במטרים.
  * `start_time` / `end_time`: Timestamp (חובה) - חלון הזמן המבוקש.
  * `status`: Enum (חובה) - סטטוס בקשה: `DRAFT`, `PENDING_REVIEW`, `APPROVED`, `REJECTED`, `CANCELLED`.
  * `notes`: String (אופציונלי) - הערות מגיש הבקשה.
  * `reviewer_notes`: String (אופציונלי) - הערות מאשר הבקשה.
  * `created_at` / `updated_at`: Timestamp (חובה).
  * `created_by` / `updated_by`: UUID (חובה).

### 1.6. Polygon (מרחב אווירי מאושר / הגבלה)
ייצוג גיאוגרפי תלת-ממדי של מרחב אווירי מאושר או מוגבל.
* **שדות:**
  * `id`: UUID (חובה).
  * `name`: String (חובה).
  * `geometry`: Geometry Polygon (חובה) - פוליגון דו-ממדי של הגבולות.
  * `floor_altitude`: Float (חובה) - גובה תחתון (מטרים).
  * `ceiling_altitude`: Float (חובה) - גובה עליון (מטרים).
  * `start_time` / `end_time`: Timestamp (חובה) - תוקף זמני של המרחב.
  * `type`: Enum (חובה) - סוג המרחב: `CORRIDOR` (נתיב מאושר), `NFZ` (אזור אסור טיסה), `RESTRICTED_ZONE` (אזור מוגבל זמני).
  * `flight_request_id`: UUID (אופציונלי) - קשר ל-`FlightRequest` (אם נוצר כתוצאה מאישור טיסה).
  * `created_at` / `updated_at`: Timestamp (חובה).
  * `created_by` / `updated_by`: UUID (חובה).

### 1.7. ActiveFlight (ניהול הטסה בפועל)
מעקב אחר טיסות המתבצעות בפועל באוויר.
* **שדות:**
  * `id`: UUID (חובה).
  * `flight_request_id`: UUID (חובה) - קשר ל-`FlightRequest`.
  * `drone_id`: UUID (חובה) - קשר ל-`Drone`.
  * `actual_start_time`: Timestamp (חובה) - שעת ההמראה בפועל.
  * `actual_end_time`: Timestamp (אופציונלי) - שעת הנחיתה בפועל.
  * `status`: Enum (חובה) - סטטוס טיסה: `ACTIVE` (באוויר), `COMMS_LOSS` (אובדן קשר), `ANOMALOUS` (חריגה מנתיב/גובה), `COMPLETED` (הסתיים).
  * `created_at` / `updated_at`: Timestamp (חובה).
  * `created_by` / `updated_by`: UUID (חובה).

### 1.8. SensorDetection (גילוי סנסור)
מטרות נקלטות ממכ"ם, RF, או סנסורים חיצוניים אחרים.
* **שדות:**
  * `id`: UUID (חובה).
  * `sensor_type`: Enum (חובה) - סוג סנסור: `RADAR`, `RF_FINDER`, `OPTICAL`, `EXTERNAL_SYSTEM`.
  * `target_track_id`: String (חובה) - מזהה ייחודי של המטרה המיוצר על ידי הסנסור.
  * `latitude` / `longitude`: Double (חובה) - נקודת ציון גיאוגרפית.
  * `altitude_msl`: Float (חובה) - גובה מעל פני הים.
  * `velocity_vector`: Json (חובה) - כיוון ומהירות: `{ "heading": 120.5, "speed_mps": 15.2 }`.
  * `timestamp`: Timestamp (חובה) - זמן גילוי המטרה.

### 1.9. IdentificationEvent (אירוע זיהוי עמית/טורף)
ניהול אירוע מבצעי סביב מטרה שמיים לא מזוהה או עוינת.
* **שדות:**
  * `id`: UUID (חובה).
  * `target_track_id`: String (חובה) - מזהה המטרה הלא-מזוהה (קישור ל-`SensorDetection` או טרנספונדר).
  * `iff_status`: Enum (חובה) - סטטוס זיהוי: `BLUE_CERTAIN` (כחול ודאי), `BLUE_SUSPICIOUS` (כחול חשוד), `BLUE_ANOMALOUS` (כחול חריג), `UNIDENTIFIED` (בלתי מזוהה), `RED_SUSPICIOUS` (אדום חשוד), `RED_CERTAIN` (אדום ודאי), `CONFLICTING` (מידע סותר).
  * `certainty_level`: Float (חובה) - אחוז ודאות זיהוי (0.0 עד 1.0).
  * `reporter_user_id`: UUID (חובה) - קשר ל-`User` שפתח/דיווח על האירוע.
  * `status`: Enum (חובה) - סטטוס האירוע: `OPENED`, `ACTIVE_TIGER` (נוהל נמר פעיל), `ACTIVE_HAMMER` (פטיש אוויר פעיל), `RESOLVED`.
  * `resolution`: Enum (אופציונלי) - אופן סגירת האירוע: `NEUTRALIZED` (נוטרל), `CONFIRMED_FRIEND` (זוהה כעמית), `EXITED_AIRSPACE` (יצא מהמרחב).
  * `created_at` / `updated_at`: Timestamp (חובה).
  * `created_by` / `updated_by`: UUID (חובה).

### 1.10. SpectrumLayer (ניהול ספקטרום וחסימות)
אזורי שיבוש וחסימות תדרים במרחב.
* **שדות:**
  * `id`: UUID (חובה).
  * `name`: String (חובה) - שם אזור החסימה.
  * `geometry`: Geometry Polygon (חובה) - פוליגון גבולות השיבוש.
  * `blocked_frequencies`: Json (חובה) - רשימת טווחי תדרים חסומים: `[ { "min": 2.400, "max": 2.485 } ]`.
  * `source`: Enum (חובה) - מקור החסימה: `FRIENDLY` (כוחותינו), `HOSTILE` (אויב).
  * `severity`: Enum (חובה) - חומרת השיבוש: `HIGH`, `MEDIUM`.
  * `start_time` / `end_time`: Timestamp (חובה) - תוקף החסימה.
  * `created_at` / `updated_at`: Timestamp (חובה).
  * `created_by` / `updated_by`: UUID (חובה).

### 1.11. AirHammerEvent (פקודת פטיש אוויר)
פרטי הפעלה מבצעית של אמצעי נטרול כנגד מטרה עוינת.
* **שדות:**
  * `id`: UUID (חובה).
  * `incident_id`: UUID (חובה) - קשר ל-`IdentificationEvent`.
  * `target_track_id`: String (חובה) - מזהה מטרת השמיים העוינת.
  * `affected_area`: Geometry Polygon (חובה) - פוליגון המרחב המושפע מהפעלת פטיש האוויר.
  * `activated_at`: Timestamp (חובה) - שעת הפעלה.
  * `terminated_at`: Timestamp (אופציונלי) - שעת סגירת פטיש אוויר.
  * `created_at` / `updated_at`: Timestamp (חובה).
  * `created_by` / `updated_by`: UUID (חובה).

### 1.12. Alert (התרעות מערכת)
התרעות מופצות בזמן אמת ל-Web ולאול"רים בשטח.
* **שדות:**
  * `id`: UUID (חובה).
  * `type`: Enum (חובה) - סוג התרעה: `TIGER_ALERT`, `HAMMER_ALERT`, `SPECTRUM_CONFLICT`, `COMMS_LOSS`, `ANOMALOUS_FLIGHT`.
  * `title`: String (חובה).
  * `message`: String (חובה).
  * `target_unit_ids`: Array[UUID] (אופציונלי) - מפיץ את ההתרעה רק ליחידות מסוימות בשטח.
  * `geometry`: Geometry (אופציונלי) - נקודה או פוליגון המשויכים להתרעה.
  * `created_at`: Timestamp (חובה).

### 1.13. PingStatus (פינג וטלמטריית כלי באוויר)
הזרמת נתוני מיקום ודופק שוטפים מאפליקציית האול"ר.
* **שדות:**
  * `id`: UUID (חובה).
  * `active_flight_id`: UUID (חובה) - קשר ל-`ActiveFlight`.
  * `timestamp`: Timestamp (חובה) - זמן קבלת הפינג בשרת.
  * `latitude` / `longitude`: Double (חובה) - מיקום נוכחי.
  * `altitude_msl`: Float (חובה) - גובה מעל פני הים.
  * `altitude_agl`: Float (חובה) - גובה מעל פני השטח.
  * `heading` / `speed`: Float (חובה) - כיוון תנועה ומהירות.
  * `battery_pct`: Integer (חובה) - אחוז סוללה של הרחפן.
  * `signal_strength_dbm`: Integer (חובה) - עוצמת קישוריות האול"ר.

### 1.14. AuditLog (יומן פעולות מבצעיות)
רישום קשיח ולא ניתן לשינוי של כל פעולה מבצעית רגישה לצרכי תחקור.
* **שדות:**
  * `id`: UUID (חובה).
  * `action_type`: Enum (חובה) - סוג הפעולה: `FLIGHT_APPROVED`, `FLIGHT_REJECTED`, `TIGER_DECLARED`, `HAMMER_DECLARED`, `POLYGON_CREATED`, `SPECTRUM_ZONE_UPDATED`.
  * `performed_by`: UUID (חובה) - קשר ל-`User`.
  * `entity_name`: String (חובה) - שם הישות שהושפעה (למשל: "FlightRequest").
  * `entity_id`: UUID (חובה) - מזהה הישות שהושפעה.
  * `previous_state`: Json (אופציונלי) - הנתונים לפני השינוי.
  * `new_state`: Json (אופציונלי) - הנתונים לאחר השינוי.
  * `ip_address`: String (חובה) - כתובת ה-IP של המשתמש.
  * `created_at`: Timestamp (חובה).

---

## 2. מפרט ה-REST API

כלל נתיבי ה-API דורשים הזדהות באמצעות Token (Header: `Authorization: Bearer <JWT_TOKEN>`).

### 2.1. רישום מפעיל (Operator Registration)
* **נתיב:** `POST /api/v1/auth/register-operator`
* **הרשאה מותרת:** `ROKAQ_OFFICER` (קצין רוק"ק בלבד יכול לרשום מפעיל חדש במערכת).
* **Request Body:**
```json
{
  "username": "8812733",
  "password": "SecurePassword123!",
  "full_name": "סמ''ר אלון כהן",
  "unit_id": "a501e0a8-b2c3-4d45-98e3-827c89d0a1b2",
  "license_number": "ML-99182"
}
```
* **Response (`201 Created`):**
```json
{
  "user_id": "f812dd90-7c6e-44ef-911e-8bcfa92d0012",
  "username": "8812733",
  "role": "FIELD_OPERATOR",
  "profile": {
    "unit_id": "a501e0a8-b2c3-4d45-98e3-827c89d0a1b2",
    "license_number": "ML-99182",
    "status": "ACTIVE"
  }
}
```

### 2.2. ניהול רחפנים: הוספת רחפן חדש (Drone Management)
* **נתיב:** `POST /api/v1/drones`
* **הרשאה מותרת:** `ROKAQ_OFFICER`, `HQ_OPERATOR`.
* **Request Body:**
```json
{
  "serial_number": "DJI-M300-8812AB",
  "model": "Matrice 300 RTK",
  "manufacturer": "DJI",
  "owner_unit_id": "a501e0a8-b2c3-4d45-98e3-827c89d0a1b2",
  "control_frequency": 2.4,
  "video_frequency": 5.8
}
```
* **Response (`201 Created`):**
```json
{
  "id": "c92d56ef-2781-4bc9-a789-bf81a8b27341",
  "serial_number": "DJI-M300-8812AB",
  "status": "READY"
}
```

### 2.3. יצירת בקשת טיסה (Create Flight Request)
* **נתיב:** `POST /api/v1/flight-requests`
* **הרשאה מותרת:** `FIELD_OPERATOR` (ממכשיר האול"ר).
* **Request Body:**
```json
{
  "drone_id": "c92d56ef-2781-4bc9-a789-bf81a8b27341",
  "min_altitude_agl": 20.0,
  "max_altitude_agl": 80.0,
  "start_time": "2026-06-03T14:00:00Z",
  "end_time": "2026-06-03T14:30:00Z",
  "route": {
    "type": "LineString",
    "coordinates": [
      [34.801, 31.892, 0.0],
      [34.805, 31.895, 50.0],
      [34.810, 31.891, 50.0]
    ]
  },
  "notes": "משימת תצפית ואבטחת נתיב כוחותינו"
}
```
* **Response (`201 Created`):**
```json
{
  "id": "e4b2d561-1234-4bc3-a9d2-7c89d0a1b2c3",
  "status": "PENDING_REVIEW",
  "conflict_classification": "ORANGE",
  "conflicts": [
    {
      "type": "SPECTRUM_WARN",
      "description": "הנתיב קרוב לאזור שיבוש פעיל בגזרה"
    }
  ]
}
```

### 2.4. אישור / דחיית בקשת טיסה (Review Flight Request)
* **נתיב:** `POST /api/v1/flight-requests/{id}/review`
* **הרשאה מותרת:** `ROKAQ_OFFICER` (קצין רוק"ק בלבד).
* **Request Body:**
```json
{
  "action": "APPROVE", // או "REJECT"
  "reviewer_notes": "אושר. שים לב להתרעות ל''א במזרח הגזרה."
}
```
* **Response (`200 OK`):**
```json
{
  "id": "e4b2d561-1234-4bc3-a9d2-7c89d0a1b2c3",
  "status": "APPROVED",
  "reviewer_id": "df818812-7634-4712-ba22-e4210a56ee11"
}
```

### 2.5. יצירת פוליגון מרחב אווירי (Create Airspace Polygon)
* **נתיב:** `POST /api/v1/airspace/polygons`
* **הרשאה מותרת:** `ROKAQ_OFFICER`.
* **Request Body:**
```json
{
  "name": "אזור אסור טיסה - חוות יצהר",
  "type": "NFZ",
  "floor_altitude": 0.0,
  "ceiling_altitude": 200.0,
  "start_time": "2026-06-03T12:00:00Z",
  "end_time": "2026-06-04T12:00:00Z",
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [
        [34.82, 31.90],
        [34.84, 31.90],
        [34.84, 31.92],
        [34.82, 31.92],
        [34.82, 31.90]
      ]
    ]
  }
}
```
* **Response (`201 Created`):**
```json
{
  "id": "551a08b9-12a3-48ef-bf11-c891a2bc3410",
  "status": "ACTIVE"
}
```

### 2.6. התחלת הטסה (Start Flight)
* **נתיב:** `POST /api/v1/flights/start`
* **הרשאה מותרת:** `FIELD_OPERATOR` (המטיס מודיע על המראה).
* **Request Body:**
```json
{
  "flight_request_id": "e4b2d561-1234-4bc3-a9d2-7c89d0a1b2c3"
}
```
* **Response (`200 OK`):**
```json
{
  "active_flight_id": "887a02b9-e1a4-4bc3-a991-82cfa2d19213",
  "status": "ACTIVE",
  "actual_start_time": "2026-06-03T13:19:00Z"
}
```

### 2.7. סיום הטסה (End Flight)
* **נתיב:** `POST /api/v1/flights/{id}/end`
* **הרשאה מותרת:** `FIELD_OPERATOR` (דיווח נחיתה מהשטח) או `ROKAQ_OFFICER` (סגירה יזומה מהמפקדה).
* **Request Body:** `{}` (או ריק)
* **Response (`200 OK`):**
```json
{
  "active_flight_id": "887a02b9-e1a4-4bc3-a991-82cfa2d19213",
  "status": "COMPLETED",
  "actual_end_time": "2026-06-03T13:25:00Z"
}
```

### 2.8. שליחת פינג טלמטרייה (Submit Ping)
* **נתיב:** `POST /api/v1/flights/{id}/ping`
* **הרשאה מותרת:** `FIELD_OPERATOR` (משודר אוטומטית מאפליקציית האול"ר בכל 2 שניות).
* **Request Body:**
```json
{
  "latitude": 34.8015,
  "longitude": 31.8925,
  "altitude_msl": 152.3,
  "altitude_agl": 12.5,
  "heading": 45.2,
  "speed": 8.5,
  "battery_pct": 85,
  "signal_strength_dbm": -72
}
```
* **Response (`200 OK`):**
```json
{
  "status": "RECEIVED",
  "timestamp": "2026-06-03T13:19:02Z"
}
```

### 2.9. קבלת זיהוי מסנסור (Sensor Detection Input)
* **נתיב:** `POST /api/v1/sensors/detection`
* **הרשאה מותרת:** `ROKAQ_OFFICER` / `HQ_OPERATOR` (או ישירות על ידי מפתח API ייעודי לסנסורים - System to System).
* **Request Body:**
```json
{
  "sensor_type": "RADAR",
  "target_track_id": "rad-track-4011",
  "latitude": 34.811,
  "longitude": 31.899,
  "altitude_msl": 340.0,
  "velocity_vector": {
    "heading": 180.0,
    "speed_mps": 22.0
  },
  "timestamp": "2026-06-03T13:19:01Z"
}
```
* **Response (`202 Accepted`):**
```json
{
  "message": "Detection queued for fusion",
  "track_id": "rad-track-4011"
}
```

### 2.10. דיווח זיהוי מהשטח (Field Detection Report)
* **נתיב:** `POST /api/v1/incidents/field-report`
* **הרשאה מותרת:** `FIELD_OPERATOR`.
* **Request Body:**
```json
{
  "description": "זיהוי ויזואלי של רחפן שחור קטן טס בגובה נמוך מעל גבעה 4",
  "latitude": 34.805,
  "longitude": 31.892,
  "estimated_altitude": 40.0
}
```
* **Response (`201 Created`):**
```json
{
  "report_id": "d01aa89c-b1e2-48f1-a1b2-12a9b3c4d5e6",
  "status": "SUBMITTED"
}
```

### 2.11. פתיחת אירוע עמית/טורף (Open Identification Event)
* **נתיב:** `POST /api/v1/incidents`
* **הרשאה מותרת:** `ROKAQ_OFFICER`, `HQ_OPERATOR`.
* **Request Body:**
```json
{
  "target_track_id": "rad-track-4011",
  "iff_status": "UNIDENTIFIED",
  "certainty_level": 0.5,
  "initial_details": "מטרה ללא טרנספונדר המציגה מהירות חריגה"
}
```
* **Response (`201 Created`):**
```json
{
  "incident_id": "991fa8b2-12e3-4d4b-a912-7c89a0b1c2d3",
  "status": "OPENED"
}
```

### 2.12. הפעלת נוהל נמר (Activate Tiger Procedure)
* **נתיב:** `POST /api/v1/incidents/{id}/tiger`
* **הרשאה מותרת:** `ROKAQ_OFFICER`.
* **Request Body:** `{}`
* **Response (`200 OK`):**
```json
{
  "incident_id": "991fa8b2-12e3-4d4b-a912-7c89a0b1c2d3",
  "status": "ACTIVE_TIGER",
  "activated_at": "2026-06-03T13:20:00Z"
}
```

### 2.13. הכרזת פטיש אוויר (Announce Air Hammer Event)
* **נתיב:** `POST /api/v1/incidents/{id}/hammer`
* **הרשאה מותרת:** `ROKAQ_OFFICER` (קצין רוק"ק חטיבתי בלבד).
* **Request Body:**
```json
{
  "affected_area": {
    "type": "Polygon",
    "coordinates": [
      [
        [34.80, 31.88],
        [34.82, 31.88],
        [34.82, 31.90],
        [34.80, 31.90],
        [34.80, 31.88]
      ]
    ]
  }
}
```
* **Response (`200 OK`):**
```json
{
  "hammer_event_id": "118fa8b2-44e3-4d4b-a912-8889a0b1c2d4",
  "status": "ACTIVE_HAMMER",
  "activated_at": "2026-06-03T13:20:15Z"
}
```

### 2.14. שליחת התרעות יזומות (Send Alert)
* **נתיב:** `POST /api/v1/alerts`
* **הרשאה מותרת:** `ROKAQ_OFFICER`.
* **Request Body:**
```json
{
  "type": "TIGER_ALERT",
  "title": "נמר בגזרה המזרחית",
  "message": "רחפן עוין מזוהה בנ"צ 1928-8817. כנסו למחסה מיידית והורידו רחפנים.",
  "target_unit_ids": ["a501e0a8-b2c3-4d45-98e3-827c89d0a1b2"]
}
```
* **Response (`201 Created`):**
```json
{
  "alert_id": "771fa8b2-99e3-4d4b-a912-7c89a0b1c2d9",
  "broadcast_status": "SENT"
}
```

### 2.15. דיווח ירוק בעיניים - זיהוי חזותי ידידותי (Green in Eyes Report)
* **נתיב:** `POST /api/v1/incidents/{id}/green-in-eyes`
* **הרשאה מותרת:** `FIELD_OPERATOR` (מהשטח).
* **Request Body:**
```json
{
  "visual_confirmation": true,
  "notes": "רעש מנוע וזיהוי מדבקת עמית על כלי הטיס"
}
```
* **Response (`200 OK`):**
```json
{
  "incident_id": "991fa8b2-12e3-4d4b-a912-7c89a0b1c2d3",
  "iff_status": "BLUE_CERTAIN",
  "certainty_level": 1.0
}
```

### 1.16. סגירת אירוע (Close Incident)
* **נתיב:** `POST /api/v1/incidents/{id}/close`
* **הרשאה מותרת:** `ROKAQ_OFFICER`.
* **Request Body:**
```json
{
  "resolution": "NEUTRALIZED",
  "resolution_notes": "הרחפן העוין הופל בהצלחה על ידי כוחות פטיש אוויר בשעה 13:24"
}
```
* **Response (`200 OK`):**
```json
{
  "incident_id": "991fa8b2-12e3-4d4b-a912-7c89a0b1c2d3",
  "status": "RESOLVED",
  "resolved_at": "2026-06-03T13:25:00Z"
}
```

---

## 3. ניהול שגיאות (Error Handling)

שגיאות מערכת יוחזרו במבנה קבוע (Standard RFC 7807 Problem Details).

### קודי תגובה (Status Codes):
* `400 Bad Request`: שגיאת ולידציה או נתונים לא תקינים בגוף הבקשה.
* `401 Unauthorized`: אינטגרציה ללא JWT Token בתוקף או כשל באימות.
* `403 Forbidden`: ניסיון ביצוע פעולה ללא הרשאת תפקיד מתאימה.
* `404 Not Found`: ישות (מפעיל, רחפן, בקשה) לא קיימת בבסיס הנתונים.
* `409 Conflict`: ניסיון המראה לכלי שכבר נמצא בסטטוס ACTIVE, או חפיפת תדר קשיחה.

### דוגמה למבנה תגובת שגיאה:
```json
{
  "status": 403,
  "error_code": "INSUFFICIENT_PERMISSIONS",
  "message": "רק קצין רוק''ק מורשה להכריז על פטיש אוויר",
  "timestamp": "2026-06-03T13:20:16Z"
}
```

---

## 4. תקשורת בזמן אמת (WebSocket / Realtime API)

לעדכון המפה הטקטית, ההתרעות וסטטוס הפינגים, משתמשי ה-Web וה-Android יתחברו לערוץ WebSocket ייעודי:
* **כתובת החיבור:** `wss://rokaq.idf.il/ws/live-picture?token=<JWT_TOKEN>`

### 4.1. הזרמת עדכוני מפה מהשרת (Server -> Clients)
בכל שנייה, השרת שולח את השינויים במרחב האווירי (Tracks & Dynamic Zones):

```json
{
  "event_type": "AIR_PICTURE_UPDATE",
  "timestamp": "2026-06-03T13:19:05Z",
  "payload": {
    "active_tracks": [
      {
        "track_id": "rad-track-4011",
        "iff_status": "RED_CERTAIN",
        "latitude": 34.811,
        "longitude": 31.899,
        "altitude_msl": 340.0,
        "heading": 180.0,
        "speed_mps": 22.0
      },
      {
        "track_id": "flight-track-887a02",
        "iff_status": "BLUE_CERTAIN",
        "latitude": 34.8015,
        "longitude": 31.8925,
        "altitude_msl": 152.3,
        "heading": 45.2,
        "speed_mps": 8.5
      }
    ]
  }
}
```

### 4.2. הזרמת התרעה מתפרצת מהשרת (Server -> Clients)
אירועים מתפרצים שידרשו השתלטות מסך או תצוגה מיידית:

```json
{
  "event_type": "CRITICAL_ALERT",
  "timestamp": "2026-06-03T13:20:01Z",
  "payload": {
    "alert_id": "771fa8b2-99e3-4d4b-a912-7c89a0b1c2d9",
    "alert_type": "TIGER_ALERT",
    "title": "נמר פעיל בגזרה!",
    "message": "רחפן עוין מזוהה בנ''צ 1928-8817. בצע נוהל הגנה.",
    "affected_polygon": {
      "type": "Polygon",
      "coordinates": [[[34.80, 31.88], [34.82, 31.88], [34.82, 31.90], [34.80, 31.90], [34.80, 31.88]]]
    }
  }
}
```

---

## 5. יומן מעקב פעולות מבצעיות (Audit Logging)
כל פעולה מסוג `FLIGHT_APPROVED`, `TIGER_DECLARED`, `HAMMER_DECLARED` תיכתב באופן סינכרוני לטבלת `AuditLog` כחלק מטרנזקציית ה-Database של הבקשה המקורית.

### דוגמה לרשומת Audit Log:
```json
{
  "id": "00a112b3-7645-4de4-ba91-a1b2c3d4e5f6",
  "action_type": "HAMMER_DECLARED",
  "performed_by": "df818812-7634-4712-ba22-e4210a56ee11", // קצין רוק"ק דני
  "entity_name": "AirHammerEvent",
  "entity_id": "118fa8b2-44e3-4d4b-a912-8889a0b1c2d4",
  "new_state": {
    "incident_id": "991fa8b2-12e3-4d4b-a912-7c89a0b1c2d3",
    "target_track_id": "rad-track-4011",
    "status": "ACTIVE_HAMMER"
  },
  "ip_address": "10.220.14.88",
  "created_at": "2026-06-03T13:20:15Z"
}
```
