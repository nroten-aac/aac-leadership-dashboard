import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const TAGGED_LISTS = [
  "Member Adults",
  "Member Children",
  "Regular Attender Adults",
  "Regular Attender Children",
  "Visitors",
];

/**
 * Returns a Set of member IDs that are tagged in PCO as Members, Regular
 * Attenders, or Visitors. Used to scope all roadmap charts so stale/untagged
 * records (e.g. archived people) don't inflate stage totals.
 */
export function useTaggedMemberIds() {
  return useQuery({
    queryKey: ["roadmap", "tagged-member-ids"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("member_groups")
        .select("member_id, group_name")
        .in("group_name", TAGGED_LISTS);
      if (error) throw error;
      return new Set((data || []).map((r: any) => r.member_id as string));
    },
  });
}