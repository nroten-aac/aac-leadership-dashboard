import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const ALL_TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "data-entry", label: "Data Entry" },
  { id: "members", label: "Members" },
  { id: "attendance", label: "Attendance" },
  { id: "giving", label: "Giving" },
  { id: "discipleship", label: "Discipleship" },
  { id: "projects", label: "Projects" },
] as const;

export type TabId = (typeof ALL_TABS)[number]["id"];

export function useUserRole() {
  const { user } = useAuth();

  const { data: isAdmin, isLoading: roleLoading } = useQuery({
    queryKey: ["user_role", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  const { data: allowedTabs, isLoading: tabsLoading } = useQuery({
    queryKey: ["user_tab_permissions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      // Admins get all tabs
      const { data: adminCheck } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (adminCheck) return ALL_TABS.map((t) => t.id);

      const { data } = await supabase
        .from("user_tab_permissions")
        .select("tab_name")
        .eq("user_id", user.id);
      return (data ?? []).map((d) => d.tab_name as TabId);
    },
    enabled: !!user,
  });

  return {
    isAdmin: isAdmin ?? false,
    allowedTabs: allowedTabs ?? [],
    isLoading: roleLoading || tabsLoading,
  };
}

export function useInvitations() {
  const queryClient = useQueryClient();

  const { data: invitations, isLoading } = useQuery({
    queryKey: ["invitations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invitations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: allUsers } = useQuery({
    queryKey: ["all_user_roles"],
    queryFn: async () => {
      // Get all profiles with their roles
      const { data: profiles } = await supabase.from("profiles").select("*");
      const { data: roles } = await supabase.from("user_roles").select("*");
      const { data: perms } = await supabase.from("user_tab_permissions").select("*");
      return { profiles: profiles ?? [], roles: roles ?? [], permissions: perms ?? [] };
    },
  });

  const sendInvite = useMutation({
    mutationFn: async ({ email, allowed_tabs, role }: { email: string; allowed_tabs: string[]; role: string }) => {
      const { data, error } = await supabase.functions.invoke("invite-user", {
        body: { email, allowed_tabs, role },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      queryClient.invalidateQueries({ queryKey: ["all_user_roles"] });
    },
  });

  const revokeInvite = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invitations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
    },
  });

  return {
    invitations: invitations ?? [],
    allUsers: allUsers ?? { profiles: [], roles: [], permissions: [] },
    isLoading,
    sendInvite,
    revokeInvite,
  };
}
