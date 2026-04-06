import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { admin, videos as videosApi } from "@/lib/api-client";
import { Loader2, Plus, Trash2, Edit2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  is_premium: boolean;
}

interface Video {
  id: string;
  title: string;
  category_id: string;
  thumbnail_url?: string;
  video_url: string;
  duration_seconds?: number;
  is_premium: boolean;
}

export default function VideoManager({ token }: { token: string }) {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    categoryId: "",
    description: "",
    thumbnailUrl: "",
    videoUrl: "",
    isPremium: false,
  });

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch categories
      const catResult = await admin.categories.getAll(1, 100);
      if (catResult.success && catResult.data) {
        setCategories((catResult.data as any).categories || []);
      }

      // Fetch videos
      const vidResult = await videosApi.getAll(1, 100);
      if (vidResult.success && vidResult.data) {
        setVideos((vidResult.data as any).videos || []);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const result = await admin.videos.create({
        category_id: formData.categoryId,
        title: formData.title,
        description: formData.description || null,
        thumbnail_url: formData.thumbnailUrl || null,
        video_url: formData.videoUrl,
        is_premium: formData.isPremium,
        sort_order: 0,
      });

      if (result.success) {
        toast({
          title: "Success",
          description: "Video created successfully",
        });
        setFormData({
          title: "",
          categoryId: "",
          description: "",
          thumbnailUrl: "",
          videoUrl: "",
          isPremium: false,
        });
        fetchData();
      } else {
        toast({
          title: "Error",
          description: result.error?.message || "Failed to create video",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Form */}
      <Card className="border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle>Add New Video</CardTitle>
          <CardDescription>Create a new video entry (use direct URLs for images and videos)</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateVideo} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Video Title *</label>
                <Input
                  placeholder="e.g., Amazing Action Scene"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="bg-slate-700 border-slate-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Category *</label>
                <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Video URL *</label>
                <Input
                  placeholder="https://example.com/video.mp4"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  required
                  className="bg-slate-700 border-slate-600"
                />
                <p className="text-xs text-slate-400">Direct link to video file (MP4, WebM, etc.)</p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Thumbnail URL</label>
                <Input
                  placeholder="https://example.com/thumbnail.jpg"
                  value={formData.thumbnailUrl}
                  onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                  className="bg-slate-700 border-slate-600"
                />
                <p className="text-xs text-slate-400">Direct link to thumbnail image</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Switch
                    checked={formData.isPremium}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isPremium: checked })
                    }
                  />
                  Premium Video
                </label>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Video description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-slate-700 border-slate-600"
                  rows={3}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={formLoading || !formData.title || !formData.categoryId || !formData.videoUrl}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {formLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Video
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Videos List */}
      <Card className="border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle>Videos</CardTitle>
          <CardDescription>All videos ({videos.length})</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : videos.length === 0 ? (
            <p className="text-center text-slate-400 py-8">No videos yet</p>
          ) : (
            <div className="space-y-2">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{video.title}</h3>
                    <p className="text-sm text-slate-400">
                      {video.duration_seconds && `${Math.floor(video.duration_seconds / 60)}m`}
                      {video.is_premium && " • Premium"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-500 hover:bg-blue-950"
                      disabled
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:bg-red-950"
                      disabled
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
