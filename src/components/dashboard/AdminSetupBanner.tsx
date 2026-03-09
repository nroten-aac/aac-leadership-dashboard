import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/usePermissions";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { toast } from "sonner";

const AdminSetupBanner = () => {
  const { user } = useAuth();
  const { isAdmin, isLoading } = useUserRole();
  const queryClient = useQueryClient();
  const [claiming, setClaiming] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (isLoading || isAdmin || dismissed || !user) return null;

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const { data, error } = await supabase.functions.invoke("promote-to-admin");
      if (error) throw error;
      toast.success(data?.message || "You are now an admin!");
      queryClient.invalidateQueries({ queryKey: ["user_role"] });
      queryClient.invalidateQueries({ queryKey: ["user_tab_permissions"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to claim admin access");
      setDismissed(true);
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="mb-4 p-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-foreground">No admin configured yet</p>
        <p className="text-xs text-muted-foreground">Claim admin access to manage invitations and permissions.</p>
      </div>
      <Button onClick={handleClaim} disabled={claiming} size="sm" className="shrink-0 gap-2">
        <Shield className="h-4 w-4" />
        {claiming ? "Claiming…" : "Claim Admin"}
      </Button>
    </div>
  );
};

export default AdminSetupBanner;
