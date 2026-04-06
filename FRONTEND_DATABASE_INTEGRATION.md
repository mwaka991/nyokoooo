# Frontend Changes Required - Fetch Data from Database

## Current Issue ❌
Frontend is using hardcoded data from `src/lib/videoData.ts`

## Solution ✅
Fetch all data from your Next.js backend API which queries Supabase

---

## STEP 1: Update Backend Routes

Your backend needs these endpoints (add to your Next.js app):

### File: `app/api/videos/all/route.ts`

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

### File: `app/api/videos/categories/route.ts`

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

### File: `app/api/videos/by-category/route.ts`

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
    // First, get category by name
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

    // Then get videos for that category
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

---

## STEP 2: Create Frontend Service Hook

### File: `src/hooks/useVideos.ts`

```typescript
import { useState, useEffect } from "react";

export interface Video {
  id: string;
  title: string;
  category_id: string;
  thumbnail_url: string;
  video_url: string;
  director?: string;
  production?: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  is_premium: boolean;
  is_active: boolean;
  sort_order: number;
}

export function useAllVideos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVideos() {
      try {
        setLoading(true);
        const response = await fetch("/api/videos/all", {
          credentials: "include",
        });

        if (!response.ok) throw new Error("Failed to fetch videos");

        const data = await response.json();
        setVideos(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchVideos();
  }, []);

  return { videos, loading, error };
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true);
        const response = await fetch("/api/videos/categories", {
          credentials: "include",
        });

        if (!response.ok) throw new Error("Failed to fetch categories");

        const data = await response.json();
        setCategories(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  return { categories, loading, error };
}

export function useVideosByCategory(categoryName: string) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!categoryName) return;

    async function fetchVideos() {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/videos/by-category?category=${encodeURIComponent(categoryName)}`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) throw new Error("Failed to fetch videos");

        const data = await response.json();
        setVideos(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchVideos();
  }, [categoryName]);

  return { videos, loading, error };
}
```

---

## STEP 3: Update Frontend Components

### Update: `src/components/CategoryTabs.tsx`

```typescript
import { useCategories } from "@/hooks/useVideos";

export type Category = string;

export function CategoryTabs({
  selectedCategory,
  onCategoryChange,
}: {
  selectedCategory: Category;
  onCategoryChange: (category: Category) => void;
}) {
  const { categories, loading, error } = useCategories();

  if (loading) return <div>Loading categories...</div>;
  if (error) return <div>Error: {error}</div>;

  // Filter to display categories (not premium ones initially)
  const displayCategories = categories
    .filter((c) => !c.is_premium)
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {displayCategories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.name)}
          className={`px-4 py-2 rounded whitespace-nowrap ${
            selectedCategory === category.name
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-800"
          }`}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
```

### Update: `src/pages/Index.tsx`

```typescript
import { useState, useEffect } from "react";
import { VideoGrid } from "@/components/VideoGrid";
import { CategoryTabs } from "@/components/CategoryTabs";
import { useVideosByCategory, useCategories } from "@/hooks/useVideos";

export default function IndexPage() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const { categories } = useCategories();
  const { videos, loading } = useVideosByCategory(selectedCategory);

  // Set initial category
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      // Set first free category as default
      const firstFreeCategory = categories.find((c) => !c.is_premium);
      if (firstFreeCategory) {
        setSelectedCategory(firstFreeCategory.name);
      }
    }
  }, [categories, selectedCategory]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Videos</h1>

      <CategoryTabs
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {loading ? (
        <div>Loading videos...</div>
      ) : (
        <VideoGrid videos={videos} />
      )}
    </div>
  );
}
```

---

## STEP 4: Update VideoGrid Component

### File: `src/components/VideoGrid.tsx`

```typescript
import { Video } from "@/hooks/useVideos";
import { VideoCard } from "@/components/VideoCard";

export function VideoGrid({ videos }: { videos: Video[] }) {
  if (videos.length === 0) {
    return <div className="text-center py-8">No videos found</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}
```

### File: `src/components/VideoCard.tsx`

```typescript
import { Video } from "@/hooks/useVideos";

export function VideoCard({ video }: { video: Video }) {
  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden hover:scale-105 transition">
      <img
        src={video.thumbnail_url}
        alt={video.title}
        className="w-full h-40 object-cover"
      />
      <div className="p-3">
        <h3 className="font-semibold text-white truncate">{video.title}</h3>
        <p className="text-sm text-gray-400 truncate">
          {video.director} • {video.production}
        </p>
      </div>
    </div>
  );
}
```

---

## STEP 5: Delete Old Hardcoded Data

Once everything is working:

❌ Delete this file: `src/lib/videoData.ts`

✅ All data now comes from Supabase database via your backend API

---

## COMPLETE DATA FLOW

```
┌─────────────────────────┐
│    Supabase Database    │
│  (categories, videos)   │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│   Next.js Backend API   │
│ /api/videos/*           │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  Frontend React Hooks   │
│  useVideos()            │
│  useCategories()        │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  UI Components          │
│  CategoryTabs           │
│  VideoGrid              │
│  VideoCard              │
└─────────────────────────┘
```

---

## TESTING

1. Start your backend: `npm run dev` (from chombezo-backend)
2. Start frontend: `npm run dev` (from static-stream)
3. Open browser to http://localhost:8080
4. Should see categories loading from database
5. Should see videos loading by category
6. Check browser console for any errors

---

## Benefits of This Approach ✅

- ✅ All data in one place (Supabase)
- ✅ Easy to add/edit videos without redeploying frontend
- ✅ Real-time updates
- ✅ Can manage premium access at database level
- ✅ Analytics and tracking in database
- ✅ Scalable to thousands of videos
- ✅ No hardcoded data in frontend

Done!
