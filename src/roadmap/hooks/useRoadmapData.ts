import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LAWS, BUILTIN_ACTIONS } from "../seed";
import type { Law, LawStatus, Action, ActivityEvent, Stage } from "../types";

// ---------------- Vision ----------------
export function useVision() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["roadmap", "vision"],
    queryFn: async () => {
      const { data } = await supabase.from("vision_statement" as any).select("*").eq("id", 1).maybeSingle();
      return (data as any)?.statement as string | null;
    },
  });
  const save = useMutation({
    mutationFn: async (statement: string) => {
      await supabase.from("vision_statement" as any).upsert({ id: 1, statement, updated_at: new Date().toISOString() } as any);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roadmap", "vision"] }),
  });
  return { vision: query.data ?? null, save: save.mutate, loading: query.isLoading };
}

// ---------------- Law status overrides ----------------
export function useLawStatusOverrides() {
  return useQuery({
    queryKey: ["roadmap", "law-status"],
    queryFn: async () => {
      const { data } = await supabase.from("law_status_overrides" as any).select("law_n, status");
      const map: Record<string, LawStatus> = {};
      (data || []).forEach((r: any) => { map[r.law_n] = r.status; });
      return map;
    },
  });
}

// ---------------- Custom actions ----------------
export function useCustomActions() {
  return useQuery({
    queryKey: ["roadmap", "custom-actions"],
    queryFn: async () => {
      const { data } = await supabase.from("custom_actions" as any).select("*");
      return ((data || []) as any[]).map((r) => ({
        id: r.id, phase: r.phase, source: r.source, law: r.law_n, title: r.title, body: r.body,
      })) as Action[];
    },
  });
}

// ---------------- Action completions ----------------
export function useActionCompletions() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["roadmap", "action-completions"],
    queryFn: async () => {
      const { data } = await supabase.from("action_completions" as any).select("action_id, is_done");
      const map: Record<string, boolean> = {};
      (data || []).forEach((r: any) => { map[r.action_id] = r.is_done; });
      return map;
    },
  });
  const toggle = useMutation({
    mutationFn: async ({ actionId, isDone, lawN, title }: { actionId: string; isDone: boolean; lawN: string; title?: string }) => {
      await supabase.from("action_completions" as any).upsert({
        action_id: actionId, is_done: isDone, completed_at: isDone ? new Date().toISOString() : null,
      } as any);
      await supabase.from("activity_events" as any).insert({
        type: "action-toggle",
        payload: { actionId, lawN, isDone, title },
      } as any);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roadmap", "action-completions"] });
      qc.invalidateQueries({ queryKey: ["roadmap", "events"] });
    },
  });
  return { completions: query.data ?? {}, toggle: toggle.mutate };
}

// ---------------- All actions (built-in + custom) ----------------
export function useAllActions(): Action[] {
  const { data } = useCustomActions();
  return [...BUILTIN_ACTIONS, ...(data || [])];
}

// ---------------- Activity events ----------------
export function useActivityEvents(limit = 50) {
  return useQuery({
    queryKey: ["roadmap", "events", limit],
    queryFn: async () => {
      const { data } = await supabase.from("activity_events" as any).select("*").order("ts", { ascending: false }).limit(limit);
      return ((data || []) as any[]).map((r) => ({
        type: r.type, ts: new Date(r.ts).getTime(), payload: r.payload,
      })) as ActivityEvent[];
    },
  });
}

// ---------------- Members → Roadmap "people" ----------------
const STAGE_MAP: Record<string, Stage> = {
  connecting: "connect",
  belonging: "belong",
  maturing: "mature",
  ministering: "minister",
  multiplying: "multiply",
};
export function dbStageToRoadmap(s?: string | null): Stage {
  return STAGE_MAP[(s || "connecting").toLowerCase()] || "connect";
}

export function useMembers() {
  return useQuery({
    queryKey: ["roadmap", "members"],
    queryFn: async () => {
      const { data } = await supabase.from("members").select("id, first_name, last_name, discipleship_stage, phase, rhythms, stage_updated_at, email, phone, photo_url, household_name, membership_status, membership_date");
      return data || [];
    },
  });
}

// ---------------- Member statuses (Member / Regular Attender / Visitor) ----------------
// Derived from member_groups rows whose group_type = 'membership'. Visitors are not
// currently synced into members/member_groups (only the PCO list count is available),
// but we keep the key so visitors can be supported once they sync.
export type MemberStatus = "member" | "regular" | "visitor";

const STATUS_LISTS: Record<MemberStatus, string[]> = {
  member:  ["Member Adults", "Member Children"],
  regular: ["Regular Attender Adults", "Regular Attender Children"],
  visitor: ["Visitors"],
};

export function useMemberStatuses() {
  return useQuery({
    queryKey: ["roadmap", "member-statuses"],
    queryFn: async () => {
      const { data } = await supabase
        .from("member_groups")
        .select("member_id, group_name, group_type")
        .eq("group_type", "membership");
      const priority: Record<MemberStatus, number> = { member: 3, regular: 2, visitor: 1 };
      const map = new Map<string, MemberStatus>();
      (data || []).forEach((g: any) => {
        const key = (Object.keys(STATUS_LISTS) as MemberStatus[]).find((k) =>
          STATUS_LISTS[k].includes(g.group_name)
        );
        if (!key) return;
        const cur = map.get(g.member_id);
        if (!cur || priority[key] > priority[cur]) map.set(g.member_id, key);
      });
      return map;
    },
  });
}

// ---------------- Laws (seed merged with overrides) ----------------
export function useLaws(): Law[] {
  const { data: statusMap = {} } = useLawStatusOverrides();
  return LAWS.map((l) => ({ ...l, status: statusMap[l.n] ?? l.status }));
}
