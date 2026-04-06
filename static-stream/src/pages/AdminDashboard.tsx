import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CategoryManager from "@/components/admin/CategoryManager";
import VideoManager from "@/components/admin/VideoManager";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Check if admin is logged in
    const savedToken = localStorage.getItem("admin_token");
    if (!savedToken) {
      navigate("/admin/login");
    } else {
      setToken(savedToken);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    toast({
      title: "Logged Out",
      description: "You have been logged out",
    });
    navigate("/admin/login");
  };

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="border-slate-600 hover:bg-slate-700"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="categories" className="w-full">
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="categories" className="data-[state=active]:bg-blue-600">
              Categories
            </TabsTrigger>
            <TabsTrigger value="videos" className="data-[state=active]:bg-blue-600">
              Videos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="mt-6">
            <CategoryManager token={token} />
          </TabsContent>

          <TabsContent value="videos" className="mt-6">
            <VideoManager token={token} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
