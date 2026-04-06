import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { admin } from "@/lib/api-client";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  is_premium: boolean;
  sort_order: number;
}

export default function CategoryManager({ token }: { token: string }) {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    isPremium: false,
    sortOrder: 0,
  });

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, [token]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const result = await admin.categories.getAll(1, 100);
      if (result.success && result.data) {
        setCategories((result.data as any).categories || []);
      } else {
        toast({
          title: "Error",
          description: "Failed to load categories",
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
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const result = await admin.categories.create({
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, "-"),
        is_premium: formData.isPremium,
        sort_order: formData.sortOrder,
      });

      if (result.success) {
        toast({
          title: "Success",
          description: "Category created successfully",
        });
        setFormData({
          name: "",
          slug: "",
          isPremium: false,
          sortOrder: 0,
        });
        fetchCategories();
      } else {
        toast({
          title: "Error",
          description: result.error?.message || "Failed to create category",
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
          <CardTitle>Add New Category</CardTitle>
          <CardDescription>Create a new video category</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category Name</label>
                <Input
                  placeholder="e.g., Action Movies"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="bg-slate-700 border-slate-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Slug (URL-friendly)</label>
                <Input
                  placeholder="e.g., action-movies"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="bg-slate-700 border-slate-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Sort Order</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  className="bg-slate-700 border-slate-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Switch
                    checked={formData.isPremium}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isPremium: checked })
                    }
                  />
                  Premium Category
                </label>
              </div>
            </div>

            <Button
              type="submit"
              disabled={formLoading || !formData.name}
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
                  Create Category
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Categories List */}
      <Card className="border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>All video categories ({categories.length})</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : categories.length === 0 ? (
            <p className="text-center text-slate-400 py-8">No categories yet</p>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition"
                >
                  <div className="flex-1">
                    <h3 className="font-medium">{category.name}</h3>
                    <p className="text-sm text-slate-400">{category.slug}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm">
                      {category.is_premium ? (
                        <span className="text-yellow-500 font-medium">Premium</span>
                      ) : (
                        <span className="text-green-500 font-medium">Free</span>
                      )}
                    </span>
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
