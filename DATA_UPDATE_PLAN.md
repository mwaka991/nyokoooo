# 🎬 Complete Database Update & Integration Plan

## Overview

You want to move all your video and category data to Supabase database instead of hardcoding it. This guide walks you through the entire process.

---

## 📋 SUMMARY OF YOUR NEW DATA

### Categories (6 total)
- **Free Categories (4):**
  1. Za moto (12 videos)
  2. Za Kizungu (32 videos)
  3. Za Kibongo (32 videos)
  4. Muvi za kikubwa (12 videos)

- **Premium Categories (2):**
  5. Connections (54 videos)
  6. Vibao Kata Uchi (12 videos)

**Total Videos: 154**

### Video Info Captured
- ID
- Title
- Category
- Thumbnail URL (placeholder for now, update later with your imports)
- Video URL (Cloudinary)
- Director
- Production
- Description

---

## 🔧 IMPLEMENTATION STEPS

### PHASE 1: Database Setup (5 minutes)

#### Step 1a: Clear Old Data
1. Go to [Supabase](https://supabase.com) → Your Project
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy & paste:
```sql
DELETE FROM videos;
DELETE FROM categories;
```
5. Click **Run**

#### Step 1b: Insert Categories
1. Click **New Query**
2. Copy this command from file: `SUPABASE_UPDATE_COMMANDS.sql`
3. Paste the **INSERT INTO categories** section only
4. Click **Run**

#### Step 1c: Get Category IDs ⚠️ IMPORTANT
1. Click **New Query**
2. Paste:
```sql
SELECT id, name, is_premium FROM categories ORDER BY sort_order;
```
3. Click **Run**
4. **Copy these IDs - you'll need them next!**
```
Za moto          = ID_1
Za Kizungu       = ID_2
Za Kibongo       = ID_3
Muvi za kikubwa  = ID_4
Connections      = ID_5
Vibao Kata Uchi  = ID_6
```

#### Step 1d: Insert Videos
1. Open file: `SUPABASE_UPDATE_COMMANDS.sql`
2. Find the video INSERT statements
3. Replace placeholder IDs:
   - `{CAT_ID_ZA_MOTO}` → your ID_1
   - `{CAT_ID_ZA_KIZUNGU}` → your ID_2
   - `{CAT_ID_ZA_KIBONGO}` → your ID_3
   - `{CAT_ID_MUVI}` → your ID_4
   - `{CAT_ID_CONNECTIONS}` → your ID_5
   - `{CAT_ID_VIBAO}` → your ID_6
4. Copy entire updated INSERT statements into Supabase SQL Editor
5. Click **Run**

#### Step 1e: Verify
1. Click **New Query**
2. Paste:
```sql
SELECT c.name, COUNT(v.id) as video_count 
FROM categories c 
LEFT JOIN videos v ON c.id = v.category_id 
GROUP BY c.id, c.name;
```
3. Click **Run** - Should show:
```
Za moto          → 12 videos
Za Kizungu       → 32 videos
Za Kibongo       → 32 videos
Muvi za kikubwa  → 12 videos
Connections      → 54 videos
Vibao Kata Uchi  → 12 videos
```

✅ **PHASE 1 COMPLETE**

---

### PHASE 2: Backend API Setup (10 minutes)

#### Step 2a: Create API Routes

Create these 3 files in your `chombezo-backend/` project:

**File 1: `app/api/videos/all/route.ts`**
```typescript
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

**File 2: `app/api/videos/categories/route.ts`**
```typescript
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

**File 3: `app/api/videos/by-category/route.ts`**
```typescript
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryName = searchParams.get("category");

  if (!categoryName) {
    return NextResponse.json(
      { error: "category parameter required" },
      { status: 400 }
    );
  }

  try {
    const { data: categoryData, error: categoryError } = await supabase
      .from("categories")
      .select("id")
      .eq("name", categoryName)
      .eq("is_active", true)
      .single();

    if (categoryError || !categoryData) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    const { data: videos, error: videosError } = await supabase
      .from("videos")
      .select("*")
      .eq("category_id", categoryData.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (videosError) throw videosError;

    return NextResponse.json(videos);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

#### Step 2b: Test Backend Routes

Start your backend:
```bash
cd chombezo-backend
npm run dev
```

Test in browser or Postman:
- `http://localhost:3000/api/videos/all` → should return 154 videos
- `http://localhost:3000/api/videos/categories` → should return 6 categories
- `http://localhost:3000/api/videos/by-category?category=Za%20moto` → should return 12 videos

✅ **PHASE 2 COMPLETE**

---

### PHASE 3: Frontend Integration (15 minutes)

#### Step 3a: Create Fetch Hooks

Create file: `src/hooks/useVideos.ts`
(Copy content from `FRONTEND_DATABASE_INTEGRATION.md` section "Create Frontend Service Hook")

#### Step 3b: Create/Update Components

Update these files in `static-stream/`:
1. `src/components/CategoryTabs.tsx` - Use `useCategories()` hook
2. `src/pages/Index.tsx` - Use `useVideosByCategory()` hook
3. `src/components/VideoGrid.tsx` - Display fetched videos
4. `src/components/VideoCard.tsx` - Show video card from DB data

(Copy implementations from `FRONTEND_DATABASE_INTEGRATION.md`)

#### Step 3c: Test Frontend

1. Start backend (if not running):
```bash
cd chombezo-backend
npm run dev
```

2. Start frontend (in new terminal):
```bash
cd static-stream
npm run dev
```

3. Open http://localhost:8080 in browser

4. You should see:
   - Categories loading from database
   - Videos appearing under each category
   - Thumbnails loading (placeholders for now)
   - Click category tabs → videos change

✅ **PHASE 3 COMPLETE**

---

### PHASE 4: Update Thumbnail Images (Later)

When you're ready to add real thumbnail images:

#### Option A: Update via SQL
```sql
UPDATE videos 
SET thumbnail_url = 'https://your-image-url.jpg'
WHERE category_id = 1;
```

#### Option B: Import in Frontend
```typescript
import thumbBeauty1 from "@/assets/thumb-beauty-1.jpg";
import thumbReallife1 from "@/assets/thumb-reallife-1.jpg";
import thumbMusic1 from "@/assets/thumb-music-1.jpg";
import thumbFeature1 from "@/assets/thumb-feature-1.jpg";

// Then update ALL videos for each category
UPDATE videos SET thumbnail_url = 'https://path-to-thumb-beauty-1.jpg' WHERE category_id = 1;
UPDATE videos SET thumbnail_url = 'https://path-to-thumb-reallife-1.jpg' WHERE category_id = 2;
```

✅ **PHASE 4 COMPLETE** (Can do this anytime)

---

## 📁 FILES PROVIDED

1. **SUPABASE_UPDATE_COMMANDS.sql** - All SQL commands to update database
2. **DATABASE_UPDATE_GUIDE.md** - Step-by-step Supabase instructions
3. **FRONTEND_DATABASE_INTEGRATION.md** - Backend API + Frontend component code
4. **DATA_UPDATE_PLAN.md** - This file

---

## ✅ VERIFICATION CHECKLIST

After completing all phases, verify:

- [ ] Database has 6 categories
- [ ] Database has 154 videos total
- [ ] Backend API `/api/videos/all` returns all videos
- [ ] Backend API `/api/videos/categories` returns all categories
- [ ] Backend API `/api/videos/by-category` filters correctly
- [ ] Frontend loads categories on startup
- [ ] Frontend displays correct videos per category
- [ ] Clicking category tabs filters videos
- [ ] No console errors in browser
- [ ] No console errors in backend
- [ ] Premium categories marked as `is_premium = true`
- [ ] Free categories marked as `is_premium = false`

---

## 🎯 WHAT'S DIFFERENT NOW

### Before ❌
```typescript
// Hardcoded in frontend
export const videos = [
  { id: "b1", title: "...", category: "Za moto", ... },
  { id: "b2", title: "...", category: "Za moto", ... },
  ...
];
```
- Hard to update
- Must redeploy frontend to add videos
- Data scattered across files

### After ✅
```typescript
// From database via API
const { videos } = useVideosByCategory("Za moto");
// Returns all videos for that category from Supabase
```
- Easy to update (just SQL)
- No frontend redeploy needed
- Single source of truth
- Scalable to millions of videos

---

## 🚀 NEXT STEPS

1. **Run Phase 1** - Update Supabase database
2. **Run Phase 2** - Create backend API routes
3. **Run Phase 3** - Update frontend components
4. **Run Phase 4** - Update thumbnails when ready

---

## 💡 TIPS

- **Test incrementally** - Don't try to do all phases at once
- **Check API responses** - Use Postman/browser to verify endpoints work
- **Check browser console** - Look for fetch errors if videos don't show
- **Check backend logs** - Look for database query errors
- **Start fresh** - Delete old `videoData.ts` after frontend is working with API

---

## ❓ COMMON ISSUES

**Problem:** Videos not showing in frontend
- Check: Backend running on port 3000?
- Check: Frontend calling correct API URL?
- Check: Browser network tab - any 404/500 errors?

**Problem:** "Foreign key constraint failed" error in Supabase
- Check: Did you insert categories BEFORE videos?
- Check: Did you use correct category IDs in INSERT statements?

**Problem:** Categories show but videos don't
- Check: Did you replace placeholder IDs in INSERT statements?
- Check: Are videos marked `is_active = true` in database?

**Problem:** Thumbnails not loading
- Check: Are thumbnail URLs valid (starts with https://)?
- Check: Can you open URL in browser directly?

---

## 📞 NEED HELP?

If something doesn't work:
1. Check the verification steps above
2. Look at error messages in browser console (F12)
3. Look at backend terminal for errors
4. Verify data in Supabase: Run `SELECT * FROM videos LIMIT 5;`

---

## 🎬 THAT'S IT!

Your system is now:
- ✅ Database-driven
- ✅ Scalable
- ✅ Easy to maintain
- ✅ Ready for production

Enjoy! 🚀
