# Database Update Guide - Step by Step

## IMPORTANT: Get Category IDs First!

Before you can insert videos, you need to know the category IDs. Follow these steps:

---

## STEP 1: Delete Old Data (Optional - Only if updating)

Go to [Supabase SQL Editor](https://supabase.com) → Your Project → SQL Editor

Run this:
```sql
DELETE FROM videos;
DELETE FROM categories;
```

---

## STEP 2: Insert New Categories

Copy and paste this in SQL Editor:

```sql
INSERT INTO categories (name, slug, description, is_premium, is_active, sort_order) VALUES
  ('Za moto', 'za-moto', 'Hot and steamy content', FALSE, TRUE, 1),
  ('Za Kizungu', 'za-kizungu', 'Real life stories', FALSE, TRUE, 2),
  ('Za Kibongo', 'za-kibongo', 'Music and rhythm', FALSE, TRUE, 3),
  ('Muvi za kikubwa', 'muvi-za-kikubwa', 'Feature films', FALSE, TRUE, 4),
  ('Connections', 'connections', 'Premium exclusive content', TRUE, TRUE, 5),
  ('Vibao Kata Uchi', 'vibao-kata-uchi', 'Ultra premium uncensored', TRUE, TRUE, 6);
```

✅ Run this command

---

## STEP 3: Get Category IDs

**IMPORTANT**: Run this command and **copy the IDs** from the result:

```sql
SELECT id, name, is_premium FROM categories ORDER BY sort_order;
```

You'll see something like:
```
| id  | name                 | is_premium |
|-----|----------------------|-----------|
| 1   | Za moto              | false     | ← CAT_ID_ZA_MOTO = 1
| 2   | Za Kizungu           | false     | ← CAT_ID_ZA_KIZUNGU = 2
| 3   | Za Kibongo           | false     | ← CAT_ID_ZA_KIBONGO = 3
| 4   | Muvi za kikubwa      | false     | ← CAT_ID_MUVI = 4
| 5   | Connections          | true      | ← CAT_ID_CONNECTIONS = 5
| 6   | Vibao Kata Uchi      | true      | ← CAT_ID_VIBAO = 6
```

**Note these IDs down - you'll need them in next step!**

---

## STEP 4: Insert Videos

Now replace the placeholder IDs in the SQL file with your actual IDs:

**In the file `SUPABASE_UPDATE_COMMANDS.sql` locate these placeholders and replace:**
- `{CAT_ID_ZA_MOTO}` → replace with `1` (or your actual ID)
- `{CAT_ID_ZA_KIZUNGU}` → replace with `2` (or your actual ID)
- `{CAT_ID_ZA_KIBONGO}` → replace with `3` (or your actual ID)
- `{CAT_ID_MUVI}` → replace with `4` (or your actual ID)
- `{CAT_ID_CONNECTIONS}` → replace with `5` (or your actual ID)
- `{CAT_ID_VIBAO}` → replace with `6` (or your actual ID)

Then copy the entire SQL INSERT statements and paste into Supabase SQL Editor and run them.

---

## STEP 5: Verify Data Was Inserted

Run these to check:

```sql
-- Check all categories
SELECT id, name, is_premium, sort_order FROM categories ORDER BY sort_order;

-- Check video counts per category
SELECT c.name, COUNT(v.id) as video_count 
FROM categories c 
LEFT JOIN videos v ON c.id = v.category_id 
GROUP BY c.id, c.name;

-- Check all videos
SELECT v.id, v.title, c.name as category, c.is_premium 
FROM videos v 
JOIN categories c ON v.category_id = c.id 
ORDER BY c.sort_order, v.sort_order;
```

✅ All your data should now appear!

---

## DATA STRUCTURE SUMMARY

| Category | Type | Videos | Thumbnail |
|----------|------|--------|-----------|
| Za moto | Free | 12 | placeholder (update later) |
| Za Kizungu | Free | 32 | placeholder (update later) |
| Za Kibongo | Free | 32 | placeholder (update later) |
| Muvi za kikubwa | Free | 12 | placeholder (update later) |
| Connections | Premium | 54 | placeholder (update later) |
| Vibao Kata Uchi | Premium | 12 | placeholder (update later) |

**Total: 154 videos across 6 categories**

---

## UPDATING THUMBNAILS LATER

When you have actual thumbnail images, update the `thumbnail_url` field:

```sql
UPDATE videos 
SET thumbnail_url = 'https://your-image-url.jpg'
WHERE category_id = 1 AND id = 'b1';
```

Or update entire category:
```sql
UPDATE videos 
SET thumbnail_url = 'https://your-beauty-thumbnail.jpg'
WHERE category_id = 1;
```

---

## FRONTEND DATA FETCHING

Your frontend will now fetch all data from the database. Make sure your backend has this endpoint:

```typescript
// API endpoint that fetches from database
GET /api/videos/all
GET /api/videos/category/{categoryName}
GET /api/categories
```

The frontend should call these endpoints instead of using hardcoded data.

---

## DATABASE TABLE SCHEMA

```
categories table:
- id (UUID, PRIMARY KEY)
- name (VARCHAR)
- slug (VARCHAR)
- description (VARCHAR)
- is_premium (BOOLEAN)
- is_active (BOOLEAN)
- sort_order (INTEGER)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

videos table:
- id (UUID, PRIMARY KEY)
- category_id (UUID, FOREIGN KEY → categories.id)
- title (VARCHAR)
- description (VARCHAR)
- thumbnail_url (VARCHAR)
- video_url (VARCHAR)
- director (VARCHAR)
- production (VARCHAR)
- is_active (BOOLEAN)
- sort_order (INTEGER)
- views_count (INTEGER, default 0)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

---

## TROUBLESHOOTING

**Q: "Foreign key constraint failed"**
A: Make sure category IDs exist before inserting videos. Run Step 3 query first to verify IDs.

**Q: Videos not showing in frontend**
A: Make sure your backend API is fetching from DB and returning correct JSON structure.

**Q: Want to add more videos?**
A: Follow same pattern - just use existing category_id and increment sort_order.

---

Done! ✅
