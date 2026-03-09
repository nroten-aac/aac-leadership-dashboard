import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Settings, Save } from "lucide-react";
import { toast } from "sonner";

const SettingsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (profile?.display_name) {
      setDisplayName(profile.display_name);
    }
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: name })
        .eq("user_id", user.id);
      if (error) throw error;

      // Also update auth metadata
      await supabase.auth.updateUser({
        data: { display_name: name },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update profile");
    },
  });

  const handleSave = () => {
    if (!displayName.trim()) {
      toast.error("Please enter a name");
      return;
    }
    updateProfile.mutate(displayName.trim());
  };

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <main className="flex-1 ml-[72px] p-8 max-w-[1400px]">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your profile and preferences</p>
        </div>

        <Card className="border-0 shadow-card rounded-2xl max-w-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email || ""} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
              />
              <p className="text-xs text-muted-foreground">This name will appear in the dashboard greeting</p>
            </div>
            <Button
              onClick={handleSave}
              disabled={updateProfile.isPending || isLoading}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {updateProfile.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SettingsPage;
