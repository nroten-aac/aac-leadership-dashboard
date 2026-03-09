import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PcoListCounts {
  "Life Groups": number;
  "AAC Bible Studies": number;
  "Discipleship Groups": number;
  "PT Mentorship": number;
}

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

  const monthlyGiving = useQuery({
    queryKey: ["monthly_giving"],
    queryFn: async () => {
      const { data, error } = await supabase.from("monthly_giving").select("*");
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

  const pcoListCounts = useQuery({
    queryKey: ["pco_list_counts"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("fetch-pco-list-counts");
      if (error) throw error;
      return (data as { lists: PcoListCounts }).lists;
    },
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
  });

  const isLoading = members.isLoading || attendance.isLoading || donations.isLoading || programs.isLoading || enrollments.isLoading || monthlyGiving.isLoading;

  return {
    members: members.data ?? [],
    attendance: attendance.data ?? [],
    donations: donations.data ?? [],
    programs: programs.data ?? [],
    enrollments: enrollments.data ?? [],
    monthlyGiving: monthlyGiving.data ?? [],
    pcoListCounts: pcoListCounts.data ?? null,
    pcoListCountsLoading: pcoListCounts.isLoading,
    isLoading,
  };
}
