import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDashboardData() {
  const members = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const { data, error } = await supabase.from("members").select("*");
      if (error) throw error;
      return data;
    },
  });

  const attendance = useQuery({
    queryKey: ["attendance"],
    queryFn: async () => {
      const { data, error } = await supabase.from("attendance").select("*");
      if (error) throw error;
      return data;
    },
  });

  const donations = useQuery({
    queryKey: ["donations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("donations").select("*, members(first_name, last_name)");
      if (error) throw error;
      return data;
    },
  });

  const programs = useQuery({
    queryKey: ["discipleship_programs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("discipleship_programs").select("*");
      if (error) throw error;
      return data;
    },
  });

  const enrollments = useQuery({
    queryKey: ["program_enrollments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("program_enrollments")
        .select("*, members(first_name, last_name), discipleship_programs(name, program_type)");
      if (error) throw error;
      return data;
    },
  });

  const isLoading = members.isLoading || attendance.isLoading || donations.isLoading || programs.isLoading || enrollments.isLoading;

  return {
    members: members.data ?? [],
    attendance: attendance.data ?? [],
    donations: donations.data ?? [],
    programs: programs.data ?? [],
    enrollments: enrollments.data ?? [],
    isLoading,
  };
}
