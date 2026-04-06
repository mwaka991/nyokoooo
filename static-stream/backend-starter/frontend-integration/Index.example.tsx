/**
 * EXAMPLE: Updated Frontend Component using Backend API
 * 
 * This file shows how to update src/pages/Index.tsx to use the backend API
 * instead of hardcoded video data.
 * 
 * Before: All data hardcoded in src/lib/videoData.ts
 * After: All data fetched from backend API
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient, type Category, type Video } from '@/lib/api-client';
import { CategoryTabs } from '@/components/CategoryTabs';
import { VideoGrid } from '@/components/VideoGrid';
import { HeroSection } from '@/components/HeroSection';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

export default function Index() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [categories, setCategories] = useState<Category[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userAccess, setUserAccess] = useState<any>(null);

  // Initial load: Get categories and check access
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        
        // Fetch categories from backend
        const categoriesResponse = await apiClient.categories.getAll(true);
        if (categoriesResponse.success && categoriesResponse.data) {
          setCategories(categoriesResponse.data.categories);
          
          // Set first category as selected (or from URL)
          const categoryFromUrl = searchParams.get('category');
          if (categoryFromUrl) {
            setSelectedCategory(categoryFromUrl);
          } else if (categoriesResponse.data.categories.length > 0) {
            setSelectedCategory(categoriesResponse.data.categories[0].slug);
          }
        } else {
          throw new Error(categoriesResponse.error?.message || 'Failed to load categories');
        }

        // Check user's access level
        const accessResponse = await apiClient.access.checkStatus();
        if (accessResponse.success && accessResponse.data) {
          setUserAccess(accessResponse.data);
        }

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize');
        console.error('Initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [searchParams]);

  // Load videos when category changes
  useEffect(() => {
    const loadVideos = async () => {
      if (!selectedCategory) return;

      try {
        setLoading(true);
        
        const videosResponse = await apiClient.videos.getByCategory(selectedCategory);
        if (videosResponse.success && videosResponse.data) {
          setVideos(videosResponse.data.videos);
        } else {
          throw new Error(videosResponse.error?.message || 'Failed to load videos');
        }

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load videos');
        console.error('Videos error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadVideos();
  }, [selectedCategory]);

  // Handle category change
  const handleCategoryChange = (slug: string) => {
    setSelectedCategory(slug);
    setSearchParams({ category: slug });
  };

  if (loading && categories.length === 0) {
    return (
      <div className="min-h-screen bg-black">
        <HeroSection />
        <div className="container mx-auto px-4 py-12">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="aspect-video" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <HeroSection />

      {error && (
        <div className="container mx-auto px-4 py-4">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Category Tabs */}
      {categories.length > 0 && (
        <div className="container mx-auto px-4 py-6">
          <CategoryTabs
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategoryChange}
          />
        </div>
      )}

      {/* User Access Info */}
      {userAccess && userAccess.has_access && (
        <div className="container mx-auto px-4 py-2 text-center text-green-400 text-sm">
          ✓ Premium access active until {new Date(userAccess.premium_until).toLocaleDateString()}
        </div>
      )}

      {/* Videos Grid */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="aspect-video rounded-lg" />
            ))}
          </div>
        ) : videos.length > 0 ? (
          <VideoGrid videos={videos} userAccess={userAccess} />
        ) : (
          <div className="text-center text-gray-400 py-12">
            <p>No videos available in this category</p>
          </div>
        )}
      </div>
    </div>
  );
}
