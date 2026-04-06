import { useState, useEffect, useCallback } from "react";
import HeroSection from "@/components/HeroSection";
import CategoryTabs from "@/components/CategoryTabs";
import VideoGrid from "@/components/VideoGrid";
import VideoPlayer from "@/components/VideoPlayer";
import { categories as apiCategories, videos as apiVideos } from "@/lib/api-client";
import type { Video } from "@/lib/videoData";

interface Category {
  id: string;
  name: string;
  slug: string;
  is_premium?: boolean;
}

interface ApiVideo extends Video {
  id: string;
  category_id: string;
}

// Hardcoded videos for Vibao Kata Uchi category
const VIBAO_KATA_UCHI_VIDEOS: ApiVideo[] = [
  {
    id: "vku1",
    title: "Vibao Kata Uchi 1",
    category: "Vibao Kata Uchi" as any,
    thumbnail: "https://i.ibb.co/67wYdHvs/20260403-135715.webp",
    director: "CHOMBEZO TAMU",
    production: "CHOMBEZO TAMU",
    videoUrl: "https://drive.google.com/file/d/13_AUABffjtJbxz_U7KDrXXxiR9CVZHPP/preview",
    category_id: "vibao-kata-uchi",
  },
  {
    id: "vku2",
    title: "Vibao Kata Uchi 2",
    category: "Vibao Kata Uchi" as any,
    thumbnail: "https://i.ibb.co/67wYdHvs/20260403-135715.webp",
    director: "CHOMBEZO TAMU",
    production: "CHOMBEZO TAMU",
    videoUrl: "https://drive.google.com/file/d/1PtOvDxcBYmR3WsSMDxdmUxN_aJ2yq2tc/preview",
    category_id: "vibao-kata-uchi",
  },
  {
    id: "vku3",
    title: "Vibao Kata Uchi 3",
    category: "Vibao Kata Uchi" as any,
    thumbnail: "https://i.ibb.co/67wYdHvs/20260403-135715.webp",
    director: "CHOMBEZO TAMU",
    production: "CHOMBEZO TAMU",
    videoUrl: "https://drive.google.com/file/d/1h3zWJAzMfc2l6EFGKDJs2eCwwp9HrgZF/preview",
    category_id: "vibao-kata-uchi",
  },
  {
    id: "vku4",
    title: "Vibao Kata Uchi 4",
    category: "Vibao Kata Uchi" as any,
    thumbnail: "https://i.ibb.co/67wYdHvs/20260403-135715.webp",
    director: "CHOMBEZO TAMU",
    production: "CHOMBEZO TAMU",
    videoUrl: "https://drive.google.com/file/d/1QQHYWYfI3oeyWJ04beHYz0vaBDoqNV_X/preview",
    category_id: "vibao-kata-uchi",
  },
  {
    id: "vku5",
    title: "Vibao Kata Uchi 5",
    category: "Vibao Kata Uchi" as any,
    thumbnail: "https://i.ibb.co/67wYdHvs/20260403-135715.webp",
    director: "CHOMBEZO TAMU",
    production: "CHOMBEZO TAMU",
    videoUrl: "https://drive.google.com/file/d/1irTO3XRFxEtWdbaNgjdbz3OVNxWGohEp/preview",
    category_id: "vibao-kata-uchi",
  },
];

const Index = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [videos, setVideos] = useState<ApiVideo[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [selectedVideo, setSelectedVideo] = useState<ApiVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch categories
        const categoriesRes = await apiCategories.getAll();
        if (!categoriesRes.success) {
          throw new Error(categoriesRes.error?.message || 'Failed to load categories');
        }
        const loadedCategories = (categoriesRes.data as any)?.categories || [];
        setCategories(loadedCategories);
        
        if (loadedCategories.length > 0) {
          setActiveCategory(loadedCategories[0].name);
        }

        // Fetch videos (increased limit to fetch all videos across all categories - max 150)
        const videosRes = await apiVideos.getAll(1, 150);
        if (!videosRes.success) {
          throw new Error(videosRes.error?.message || 'Failed to load videos');
        }
        const loadedVideos = (videosRes.data as any)?.videos || [];
        setVideos(loadedVideos);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredVideos = activeCategory === "Vibao Kata Uchi" 
    ? VIBAO_KATA_UCHI_VIDEOS 
    : videos.filter((v) => {
        const videoCategory = categories.find((c) => c.id === v.category_id);
        return videoCategory?.name === activeCategory;
      });

  const handleVideoClick = useCallback((video: ApiVideo) => {
    setSelectedVideo(video);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <p className="text-muted-foreground text-sm">
            Make sure the backend is running at http://localhost:3000
          </p>
        </div>
      </div>
    );
  }

  const activeCategoryObj = categories.find((c) => c.name === activeCategory);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 py-3">
        <span className="font-display font-bold text-foreground text-lg tracking-tight">
          CHOMBEZO TAMU
        </span>
      </header>

      <HeroSection />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        <CategoryTabs 
          active={activeCategory} 
          onChange={setActiveCategory}
          categories={categories.map(c => c.name)}
        />

        <VideoGrid 
          videos={filteredVideos} 
          onVideoClick={handleVideoClick}
          category={activeCategoryObj}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-4 mt-8">
        <p className="text-center text-xs text-muted-foreground font-body">
          © 2026 CHOMBEZO TAMU. All rights reserved.
        </p>
      </footer>

      {/* Video Player Modal */}
      {selectedVideo && (
        <VideoPlayer 
          video={selectedVideo} 
          onClose={() => setSelectedVideo(null)}
          isPremium={activeCategoryObj?.is_premium && activeCategoryObj?.name !== "Vibao Kata Uchi"}
        />
      )}
    </div>
  );
};

export default Index;
