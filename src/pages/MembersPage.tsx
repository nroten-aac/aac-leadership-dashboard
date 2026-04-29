import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Search,
  RefreshCw,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Users as UsersIcon,
  Clock,
  ChevronRight,
  Home,
  Filter,
  Eye,
  EyeOff,
  Flag,
  BookOpen as BookOpenIcon,
  HandHeart as HandHeartIcon,
} from "lucide-react";
import { STAGE_ICONS } from "@/components/icons/StageIcons";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import confetti from "canvas-confetti";

// ----- Discipleship + Volunteer derivation --------------------------------

const DISCIPLESHIP_CONFIG: Array<{
  match: string[];
  label: string;
  short: string;
  bg: string;
  text: string;
  dot: string;
  color: string;
}> = [
  {
    match: ["life group"],
    label: "Life Groups",
    short: "LG",
    bg: "bg-emerald-100",
    text: "text-emerald-800",
    dot: "bg-emerald-500",
    color: "hsl(152, 60%, 36%)",
  },
  {
    match: ["bible study", "bible studies"],
    label: "Bible Studies",
    short: "BS",
    bg: "bg-sky-100",
    text: "text-sky-800",
    dot: "bg-sky-500",
    color: "hsl(205, 65%, 42%)",
  },
  {
    match: ["pt mentorship", "pt program", "pt "],
    label: "PT Mentorship",
    short: "PT",
    bg: "bg-violet-100",
    text: "text-violet-800",
    dot: "bg-violet-500",
    color: "hsl(263, 55%, 45%)",
  },
  {
    match: ["discipleship group"],
    label: "Discipleship Groups",
    short: "DG",
    bg: "bg-amber-100",
    text: "text-amber-800",
    dot: "bg-amber-500",
    color: "hsl(38, 90%, 45%)",
  },
];

type DiscipleshipTag = (typeof DISCIPLESHIP_CONFIG)[number];

const getDiscipleshipTags = (
  groups: { group_name: string; group_type: string }[]
): DiscipleshipTag[] => {
  const found = new Set<string>();
  const result: DiscipleshipTag[] = [];
  for (const g of groups) {
    if (g.group_type !== "discipleship") continue;
    const name = g.group_name?.toLowerCase() || "";
    for (const cfg of DISCIPLESHIP_CONFIG) {
      if (cfg.match.some((kw) => name.includes(kw)) && !found.has(cfg.short)) {
        found.add(cfg.short);
        result.push(cfg);
      }
    }
  }
  return result;
};

const getVolunteerRoles = (
  groups: { group_name: string; group_type: string }[]
): string[] => {
  return groups
    .filter((g) => g.group_type === "volunteer")
    .map((g) => g.group_name)
    .filter(Boolean);
};

// ----- Membership status (M / R / V) ---------------------------------------

type StatusBadge = {
  letter: "M" | "R" | "V";
  label: string;
  bg: string;
  text: string;
  ring: string;
};

const getStatusBadge = (groups: { group_name: string }[]): StatusBadge => {
  const names = groups.map((g) => g.group_name?.toLowerCase() || "");
  const has = (kw: string) => names.some((n) => n.includes(kw));
  if (has("member")) {
    return {
      letter: "M",
      label: "Member",
      bg: "bg-prussian",
      text: "text-white",
      ring: "ring-prussian/30",
    };
  }
  if (has("regular")) {
    return {
      letter: "R",
      label: "Regular Attender",
      bg: "bg-sky-600",
      text: "text-white",
      ring: "ring-sky-600/30",
    };
  }
  return {
    letter: "V",
    label: "Visitor",
    bg: "bg-amber-500",
    text: "text-white",
    ring: "ring-amber-500/30",
  };
};

// ----- Celebration ----------------------------------------------------------

const celebrateAdvancement = (color: string) => {
  // Parse hsl(h, s%, l%) → rough hex for confetti palette
  const colors = [color, "#F2C84B", "#1F4068", "#5DA9E9", "#10B981"];
  const burst = (originX: number) => {
    confetti({
      particleCount: 80,
      spread: 70,
      startVelocity: 45,
      origin: { x: originX, y: 0.65 },
      colors,
      scalar: 1.1,
      ticks: 220,
    });
  };
  burst(0.25);
  burst(0.75);
  setTimeout(
    () =>
      confetti({
        particleCount: 120,
        spread: 110,
        startVelocity: 55,
        origin: { x: 0.5, y: 0.55 },
        colors,
        scalar: 1.2,
        ticks: 260,
      }),
    180
  );
};

// ----- Stage definitions ---------------------------------------------------

type StageKey = "connecting" | "belonging" | "maturing" | "ministering" | "multiplying";

const STAGES: Array<{
  key: StageKey;
  label: string;
  description: string;
  color: string;
  bg: string;
  ring: string;
  text: string;
  dot: string;
}> = [
  {
    key: "connecting",
    label: "Connecting",
    description: "In orbit — attending but not yet committed to Christ",
    color: "hsl(215, 16%, 47%)",
    bg: "bg-slate-100",
    ring: "ring-slate-300",
    text: "text-slate-700",
    dot: "bg-slate-400",
  },
  {
    key: "belonging",
    label: "Belonging",
    description: "Came to faith, baptized, joined the church family",
    color: "hsl(205, 58%, 47%)",
    bg: "bg-sky-100",
    ring: "ring-sky-300",
    text: "text-sky-800",
    dot: "bg-sky-500",
  },
  {
    key: "maturing",
    label: "Maturing",
    description: "Growing through Scripture, small group, prayer",
    color: "hsl(152, 60%, 36%)",
    bg: "bg-emerald-100",
    ring: "ring-emerald-300",
    text: "text-emerald-800",
    dot: "bg-emerald-500",
  },
  {
    key: "ministering",
    label: "Ministering",
    description: "Using spiritual gifts in ministry within the church",
    color: "hsl(263, 55%, 38%)",
    bg: "bg-violet-100",
    ring: "ring-violet-300",
    text: "text-violet-800",
    dot: "bg-violet-500",
  },
  {
    key: "multiplying",
    label: "Multiplying",
    description: "On mission, discipling others, reproducing disciples",
    color: "hsl(350, 75%, 38%)",
    bg: "bg-rose-100",
    ring: "ring-rose-300",
    text: "text-rose-800",
    dot: "bg-rose-500",
  },
];

const STAGE_BY_KEY = Object.fromEntries(STAGES.map((s) => [s.key, s])) as Record<
  StageKey,
  (typeof STAGES)[number]
>;

// ----- Types ---------------------------------------------------------------

type MemberGroup = { group_name: string; group_type: string };
type ShepherdMember = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  household_id: string | null;
  household_name: string | null;
  discipleship_stage: StageKey;
  stage_updated_at: string;
  groups: MemberGroup[];
};

type StageHistoryRow = {
  id: string;
  member_id: string;
  previous_stage: StageKey | null;
  new_stage: StageKey;
  notes: string | null;
  changed_at: string;
};

// ----- Helpers -------------------------------------------------------------

const Avatar = ({
  member,
  size = "md",
}: {
  member: ShepherdMember;
  size?: "sm" | "md" | "lg";
}) => {
  const sizeClasses = {
    sm: "h-8 w-8 text-[10px]",
    md: "h-12 w-12 text-sm",
    lg: "h-20 w-20 text-2xl",
  };
  const initials = `${member.first_name?.[0] || ""}${
    member.last_name?.[0] || ""
  }`.toUpperCase();

  if (member.photo_url) {
    return (
      <img
        src={member.photo_url}
        alt={`${member.first_name} ${member.last_name}`}
        className={`${sizeClasses[size]} rounded-full object-cover shrink-0 ring-2 ring-white shadow-sm`}
      />
    );
  }
  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-prussian/10 flex items-center justify-center shrink-0 ring-2 ring-white shadow-sm`}
    >
      <span className="font-semibold text-prussian">{initials}</span>
    </div>
  );
};

const StageBadge = ({ stage }: { stage: StageKey }) => {
  const s = STAGE_BY_KEY[stage];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${s.bg} ${s.text} ring-1 ${s.ring}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
};

// ----- Membership type definitions ----------------------------------------

type MembershipKey =
  | "Member Adults"
  | "Member Children"
  | "Regular Attender Adults"
  | "Regular Attender Children"
  | "Visitors";

const MEMBERSHIP_TYPES: Array<{ key: MembershipKey; label: string }> = [
  { key: "Member Adults", label: "Member Adults" },
  { key: "Member Children", label: "Member Children" },
  { key: "Regular Attender Adults", label: "Regular Adults" },
  { key: "Regular Attender Children", label: "Regular Children" },
  { key: "Visitors", label: "Visitors" },
];

const DEFAULT_MEMBERSHIP_FILTER: MembershipKey[] = [
  "Member Adults",
  "Member Children",
];

// ----- Page ----------------------------------------------------------------

const MembersPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<StageKey[]>([]);
  const [membershipFilter, setMembershipFilter] = useState<MembershipKey[]>(
    DEFAULT_MEMBERSHIP_FILTER
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [stageNote, setStageNote] = useState("");
  const [savingStage, setSavingStage] = useState(false);
  const [showHousehold, setShowHousehold] = useState(true);

  // Members + groups
  const { data: members = [], isLoading, refetch } = useQuery({
    queryKey: ["shepherding-members"],
    queryFn: async () => {
      const { data: membersData, error } = await supabase
        .from("members")
        .select(
          "id, first_name, last_name, email, phone, photo_url, household_id, household_name, discipleship_stage, stage_updated_at"
        )
        .order("last_name", { ascending: true });
      if (error) throw error;

      const { data: groupsData } = await supabase
        .from("member_groups")
        .select("member_id, group_name, group_type");

      const groupsByMember = new Map<string, MemberGroup[]>();
      for (const g of groupsData || []) {
        const existing = groupsByMember.get(g.member_id) || [];
        existing.push({ group_name: g.group_name, group_type: g.group_type });
        groupsByMember.set(g.member_id, existing);
      }

      return (membersData || []).map((m: any) => ({
        ...m,
        discipleship_stage: (m.discipleship_stage || "connecting") as StageKey,
        groups: groupsByMember.get(m.id) || [],
      })) as ShepherdMember[];
    },
  });

  // Restrict to selected membership types (defaults to Members & Dependants)
  const churchFamily = useMemo(() => {
    if (membershipFilter.length === 0) return [];
    return members.filter((m) => {
      const memberLists = m.groups
        .filter((g) => g.group_type === "membership")
        .map((g) => g.group_name);
      return membershipFilter.some((t) => memberLists.includes(t));
    });
  }, [members, membershipFilter]);

  // Stage history (last 30 days for "movement" stat)
  const { data: recentHistory = [] } = useQuery({
    queryKey: ["stage-history-recent"],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const { data, error } = await supabase
        .from("discipleship_stage_history")
        .select("*")
        .gte("changed_at", since.toISOString())
        .order("changed_at", { ascending: false });
      if (error) throw error;
      return (data || []) as StageHistoryRow[];
    },
  });

  // History for selected member
  const { data: selectedHistory = [] } = useQuery({
    queryKey: ["stage-history", selectedId],
    enabled: !!selectedId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discipleship_stage_history")
        .select("*")
        .eq("member_id", selectedId!)
        .order("changed_at", { ascending: false });
      if (error) throw error;
      return (data || []) as StageHistoryRow[];
    },
  });

  // Stage counts (within church family)
  const stageCounts = useMemo(() => {
    const counts: Record<StageKey, number> = {
      connecting: 0,
      belonging: 0,
      maturing: 0,
      ministering: 0,
      multiplying: 0,
    };
    for (const m of filtered) counts[m.discipleship_stage]++;
    return counts;
  }, [filtered]);

  // Total reflects the active filters so every chart speaks about the same set.
  const total = filtered.length;
  const churchFamilyTotal = churchFamily.length;

  // Discipleship engagement: how many people are in each discipleship type,
  // plus how many are in NONE.
  const discipleshipBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    let unengaged = 0;
    for (const m of filtered) {
      const tags = getDiscipleshipTags(m.groups);
      if (tags.length === 0) {
        unengaged++;
      } else {
        for (const t of tags) {
          counts.set(t.short, (counts.get(t.short) || 0) + 1);
        }
      }
    }
    return DISCIPLESHIP_CONFIG.map((cfg) => ({
      ...cfg,
      count: counts.get(cfg.short) || 0,
    }))
      .sort((a, b) => b.count - a.count)
      .concat([
        {
          match: [],
          label: "Not yet in a group",
          short: "—",
          bg: "bg-foreground/5",
          text: "text-muted-foreground",
          dot: "bg-foreground/30",
          color: "hsl(var(--muted-foreground))",
          count: unengaged,
        } as any,
      ]);
  }, [filtered]);

  // Volunteer engagement: total serving + breakdown by team.
  const volunteerBreakdown = useMemo(() => {
    const teamCounts = new Map<string, number>();
    let serving = 0;
    for (const m of filtered) {
      const roles = getVolunteerRoles(m.groups);
      if (roles.length > 0) serving++;
      for (const r of roles) {
        teamCounts.set(r, (teamCounts.get(r) || 0) + 1);
      }
    }
    const teams = Array.from(teamCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    return { serving, notServing: total - serving, teams };
  }, [filtered, total]);

  // Filter list
  const filtered = useMemo(() => {
    return churchFamily.filter((m) => {
      if (stageFilter.length > 0 && !stageFilter.includes(m.discipleship_stage)) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        `${m.first_name} ${m.last_name}`.toLowerCase().includes(q) ||
        (m.email || "").toLowerCase().includes(q) ||
        (m.household_name || "").toLowerCase().includes(q)
      );
    });
  }, [churchFamily, search, stageFilter]);

  const selected = useMemo(
    () => members.find((m) => m.id === selectedId) || null,
    [members, selectedId]
  );

  // Other members of the selected person's household
  const householdMembers = useMemo(() => {
    if (!selected) return [];
    const key = selected.household_id || selected.household_name;
    if (!key) return [];
    return members.filter(
      (m) =>
        m.id !== selected.id &&
        ((selected.household_id && m.household_id === selected.household_id) ||
          (!selected.household_id &&
            m.household_name &&
            m.household_name === selected.household_name))
    );
  }, [members, selected]);

  // Movement stat: stage changes affecting church-family members in last 30 days
  const familyIds = useMemo(() => new Set(churchFamily.map((m) => m.id)), [churchFamily]);
  const movementCount = useMemo(
    () => recentHistory.filter((h) => familyIds.has(h.member_id)).length,
    [recentHistory, familyIds]
  );

  const handleSync = async () => {
    setImporting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Not authenticated");
        return;
      }
      const { data, error } = await supabase.functions.invoke(
        "import-planning-center-people",
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      if (error) throw error;
      toast.success(data.message || "Import complete");
      refetch();
    } catch (e: any) {
      toast.error(e.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const updateStage = async (newStage: StageKey) => {
    if (!selected) return;
    if (newStage === selected.discipleship_stage && !stageNote.trim()) {
      toast.info("Pick a different stage or add a note.");
      return;
    }
    const prevIdx = STAGES.findIndex((s) => s.key === selected.discipleship_stage);
    const nextIdx = STAGES.findIndex((s) => s.key === newStage);
    const isAdvancement = nextIdx > prevIdx;
    setSavingStage(true);
    try {
      const { error } = await supabase
        .from("members")
        .update({ discipleship_stage: newStage })
        .eq("id", selected.id);
      if (error) throw error;

      // If a note was provided, append it to the most recent history row
      // (the trigger inserts a row automatically on stage change)
      if (stageNote.trim() && newStage !== selected.discipleship_stage) {
        const { data: latest } = await supabase
          .from("discipleship_stage_history")
          .select("id")
          .eq("member_id", selected.id)
          .order("changed_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (latest?.id) {
          await supabase
            .from("discipleship_stage_history")
            .update({ notes: stageNote.trim() })
            .eq("id", latest.id);
        }
      }

      // Stage didn't change but a note was entered → manually log a note-only entry
      if (stageNote.trim() && newStage === selected.discipleship_stage) {
        await supabase.from("discipleship_stage_history").insert({
          member_id: selected.id,
          previous_stage: selected.discipleship_stage,
          new_stage: newStage,
          notes: stageNote.trim(),
        });
      }

      toast.success(`${selected.first_name} moved to ${STAGE_BY_KEY[newStage].label}`);
      if (isAdvancement) {
        celebrateAdvancement(STAGE_BY_KEY[newStage].color);
      }
      setStageNote("");
      queryClient.invalidateQueries({ queryKey: ["shepherding-members"] });
      queryClient.invalidateQueries({ queryKey: ["stage-history", selected.id] });
      queryClient.invalidateQueries({ queryKey: ["stage-history-recent"] });
    } catch (e: any) {
      toast.error(e.message || "Failed to update stage");
    } finally {
      setSavingStage(false);
    }
  };

  const currentStageIdx = selected
    ? STAGES.findIndex((s) => s.key === selected.discipleship_stage)
    : -1;
  const nextStage = currentStageIdx >= 0 && currentStageIdx < STAGES.length - 1
    ? STAGES[currentStageIdx + 1]
    : null;

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <main className="flex-1 ml-[72px] flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 space-y-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">
                Shepherding
              </h1>
              <p className="text-sm text-muted-foreground">
                Discipleship pipeline · {total} people in the church family
              </p>
            </div>
            <Button
              onClick={handleSync}
              disabled={importing}
              className="gap-2 rounded-xl bg-prussian hover:bg-prussian/90 text-primary-foreground"
            >
              <RefreshCw className={`h-4 w-4 ${importing ? "animate-spin" : ""}`} />
              {importing ? "Syncing..." : "Sync from PCO"}
            </Button>
          </div>

          {/* Pipeline funnel */}
          <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-display font-semibold text-foreground">
                    The Journey
                  </h2>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Every disciple's road — from <span className="font-medium text-foreground/80">Connecting</span> to <span className="font-medium text-amber-700">Multiplying</span>
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <UsersIcon className="h-3.5 w-3.5" />
                    {total} total
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {movementCount} stage changes (30d)
                  </div>
                </div>
              </div>

              {/* Roadmap: dashed road with milestone icons */}
              <div className="relative pt-3 pb-1">
                {/* The road — full width, dashed, pointing toward the goal */}
                <div className="absolute left-[6%] right-[6%] top-[44px] h-[3px] rounded-full bg-gradient-to-r from-slate-300 via-emerald-300 to-amber-400 opacity-70" />
                <div
                  className="absolute left-[6%] right-[6%] top-[44px] h-[3px]"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(90deg, transparent 0 8px, hsl(var(--background)) 8px 14px)",
                  }}
                />
                {/* Goal flag at the end */}
                <div className="absolute right-0 top-[24px] flex flex-col items-center text-amber-600">
                  <Flag className="h-5 w-5 fill-amber-500/30" />
                  <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">Goal</span>
                </div>

                <div className="grid grid-cols-5 gap-2 relative">
                  {STAGES.map((s, i) => {
                    const count = stageCounts[s.key];
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    // Cumulative: everyone currently at this stage or beyond has
                    // already journeyed THROUGH this milestone.
                    const journeyedThrough = STAGES.slice(i).reduce(
                      (sum, later) => sum + stageCounts[later.key],
                      0
                    );
                    const journeyedPct =
                      total > 0 ? Math.round((journeyedThrough / total) * 100) : 0;
                    const isActive = stageFilter.includes(s.key);
                    const isFinal = i === STAGES.length - 1;
                    const Icon = STAGE_ICONS[s.key];
                    // Milestone is "reached" if anyone in the (filtered) set is at this stage
                    // or has progressed beyond it.
                    const reached = STAGES.slice(i).some((later) => stageCounts[later.key] > 0);
                    return (
                      <button
                        key={s.key}
                        onClick={() =>
                          setStageFilter((prev) =>
                            prev.includes(s.key)
                              ? prev.filter((k) => k !== s.key)
                              : [...prev, s.key]
                          )
                        }
                        title={`${journeyedThrough} of ${total} have journeyed through ${s.label}`}
                        className={`group relative flex flex-col items-center text-center px-2 pt-1 pb-2 rounded-xl transition-all ${
                          isActive ? "scale-[1.04]" : "hover:scale-[1.02]"
                        } ${stageFilter.length > 0 && !isActive ? "opacity-55" : ""}`}
                      >
                        {/* Milestone marker — empty ring when not reached, filled when reached */}
                        <div
                          className={`relative z-10 h-[72px] w-[72px] rounded-full flex items-center justify-center transition-all ${
                            reached
                              ? `${s.bg} shadow-md ring-2 ring-white`
                              : "bg-background ring-2 ring-dashed border-2 border-dashed border-foreground/25"
                          } ${
                            isActive ? `ring-4 ${s.ring} shadow-lg` : ""
                          } ${isFinal && reached ? "ring-amber-400 shadow-amber-300/40" : ""}`}
                        >
                          <Icon
                            className="h-10 w-10 transition-opacity"
                            style={{
                              color: reached ? s.color : "hsl(var(--muted-foreground))",
                              opacity: reached ? 1 : 0.45,
                            }}
                          />
                          {/* Cumulative "journeyed through" badge */}
                          <span
                            className={`absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1 rounded-full bg-white shadow text-[10px] font-bold flex items-center justify-center ${
                              reached ? s.text : "text-muted-foreground"
                            }`}
                            title={`${journeyedThrough} have reached or passed ${s.label}`}
                          >
                            {journeyedThrough}
                          </span>
                          {/* "Goal" pulse on final stage when reached */}
                          {isFinal && reached && (
                            <span className="absolute inset-0 rounded-full ring-2 ring-amber-400/60 animate-ping opacity-60" />
                          )}
                        </div>

                        {/* Label */}
                        <div
                          className={`mt-2 text-[11px] font-bold uppercase tracking-wide ${s.text}`}
                        >
                          {s.label}
                        </div>

                        {/* Stat — currently here, plus cumulative journeyed-through */}
                        <div className="mt-1 flex items-baseline gap-1">
                          <span className={`text-xl font-bold ${s.text}`}>{count}</span>
                          <span className="text-[10px] text-muted-foreground">
                            here · {pct}%
                          </span>
                        </div>
                        <div className="mt-0.5 text-[10px] text-foreground/60">
                          <span className="font-semibold text-foreground/75">
                            {journeyedThrough}
                          </span>{" "}
                          journeyed through
                        </div>

                        {/* Cumulative progress bar — fills based on % who've reached this milestone */}
                        <div className="mt-1 h-1.5 w-full max-w-[120px] rounded-full bg-foreground/5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${s.dot} transition-all`}
                            style={{ width: `${Math.max(journeyedPct, journeyedThrough > 0 ? 6 : 0)}%` }}
                          />
                        </div>

                        <p className="hidden md:block text-[10px] text-foreground/55 mt-1.5 leading-tight line-clamp-2">
                          {s.description}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Caption pushing the urgency */}
                <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  <span>
                    Move every soul toward{" "}
                    <span className="font-semibold text-amber-700">Multiplying</span>
                    {total > 0 && stageCounts.multiplying < total && (
                      <>
                        {" "}— <span className="font-semibold text-foreground">{total - stageCounts.multiplying}</span> still on the road
                      </>
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, household..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-xl"
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-2 h-9"
                >
                  <Filter className="h-3.5 w-3.5" />
                  Membership
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                    {membershipFilter.length}
                  </Badge>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-60 p-3 space-y-2">
                <p className="text-xs font-semibold text-foreground mb-2">
                  Membership type
                </p>
                {MEMBERSHIP_TYPES.map((t) => {
                  const checked = membershipFilter.includes(t.key);
                  return (
                    <label
                      key={t.key}
                      className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded-lg px-2 py-1.5"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => {
                          setMembershipFilter((prev) =>
                            v
                              ? [...prev, t.key]
                              : prev.filter((k) => k !== t.key)
                          );
                        }}
                      />
                      <span className="text-foreground">{t.label}</span>
                    </label>
                  );
                })}
                <div className="flex items-center justify-between pt-2 border-t border-border/40">
                  <button
                    onClick={() =>
                      setMembershipFilter(
                        MEMBERSHIP_TYPES.map((t) => t.key)
                      )
                    }
                    className="text-[11px] text-prussian hover:underline"
                  >
                    Select all
                  </button>
                  <button
                    onClick={() =>
                      setMembershipFilter(DEFAULT_MEMBERSHIP_FILTER)
                    }
                    className="text-[11px] text-muted-foreground hover:text-foreground hover:underline"
                  >
                    Reset
                  </button>
                </div>
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-2 h-9"
                >
                  <Flag className="h-3.5 w-3.5" />
                  Stage
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                    {stageFilter.length === 0 ? "All" : stageFilter.length}
                  </Badge>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-60 p-3 space-y-2">
                <p className="text-xs font-semibold text-foreground mb-2">
                  Journey milestone
                </p>
                {STAGES.map((s) => {
                  const checked = stageFilter.includes(s.key);
                  const Icon = STAGE_ICONS[s.key];
                  return (
                    <label
                      key={s.key}
                      className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded-lg px-2 py-1.5"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => {
                          setStageFilter((prev) =>
                            v
                              ? [...prev, s.key]
                              : prev.filter((k) => k !== s.key)
                          );
                        }}
                      />
                      <span
                        className={`h-6 w-6 rounded-full flex items-center justify-center ${s.bg} ring-1 ${s.ring}`}
                      >
                        <Icon className="h-3.5 w-3.5" style={{ color: s.color }} />
                      </span>
                      <span className="text-foreground">{s.label}</span>
                    </label>
                  );
                })}
                <div className="flex items-center justify-between pt-2 border-t border-border/40">
                  <button
                    onClick={() => setStageFilter(STAGES.map((s) => s.key))}
                    className="text-[11px] text-prussian hover:underline"
                  >
                    Select all
                  </button>
                  <button
                    onClick={() => setStageFilter([])}
                    className="text-[11px] text-muted-foreground hover:text-foreground hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </PopoverContent>
            </Popover>
            <span className="text-xs text-muted-foreground ml-auto">
              Showing {filtered.length} of {total}
            </span>
          </div>
        </div>

        {/* People grid */}
        <ScrollArea className="flex-1 px-6 pb-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
              Loading church family...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm gap-2">
              <Sparkles className="h-6 w-6 opacity-50" />
              No people match your filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filtered.map((m) => {
                const stage = STAGE_BY_KEY[m.discipleship_stage];
                const status = getStatusBadge(m.groups);
                const discipleship = getDiscipleshipTags(m.groups);
                const volunteerRoles = getVolunteerRoles(m.groups);
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedId(m.id);
                      setStageNote("");
                    }}
                    className="text-left bg-card rounded-2xl border border-border/40 hover:border-prussian/30 hover:shadow-md transition-all p-4 flex items-start gap-3"
                  >
                    <div className="relative shrink-0">
                      <Avatar member={m} size="md" />
                      <span
                        title={status.label}
                        className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full ${status.bg} ${status.text} text-[10px] font-bold flex items-center justify-center ring-2 ring-card shadow`}
                      >
                        {status.letter}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {m.first_name} {m.last_name}
                      </p>
                      {m.household_name && (
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {m.household_name}
                        </p>
                      )}
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <StageBadge stage={m.discipleship_stage} />
                        <span
                          className={`text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-foreground/5 text-foreground/70`}
                        >
                          {status.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Updated{" "}
                        {formatDistanceToNow(new Date(m.stage_updated_at), {
                          addSuffix: true,
                        })}
                      </div>

                      {/* Maturing — discipleship groups */}
                      <div className="mt-2.5 flex flex-wrap gap-1" title="Discipleship groups">
                        {discipleship.length > 0 ? (
                          discipleship.map((d) => (
                            <span
                              key={d.short}
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${d.bg} ${d.text}`}
                              title={d.label}
                            >
                              {d.short}
                            </span>
                          ))
                        ) : (
                          <span className="text-[9px] italic text-muted-foreground/70">
                            No discipleship group
                          </span>
                        )}
                      </div>

                      {/* Ministering — volunteer roles */}
                      {volunteerRoles.length > 0 && (
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-rose-700">
                          <span className="font-semibold">Serves:</span>
                          <span className="truncate">
                            {volunteerRoles.slice(0, 2).join(", ")}
                            {volunteerRoles.length > 2 && (
                              <span className="text-muted-foreground">
                                {" "}
                                +{volunteerRoles.length - 2}
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Stage distribution chart — visual breakdown of where everyone stands */}
          {!isLoading && total > 0 && (
            <Card className="mt-6 border-none shadow-sm rounded-2xl overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-display font-semibold text-foreground">
                      Stage Distribution
                    </h2>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      How the church family is spread across the journey
                    </p>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {total} people total
                  </div>
                </div>

                {(() => {
                  const maxCount = Math.max(...STAGES.map((s) => stageCounts[s.key]), 1);
                  return (
                    <div className="space-y-3">
                      {STAGES.map((s, i) => {
                        const count = stageCounts[s.key];
                        const pct = total > 0 ? (count / total) * 100 : 0;
                        const barPct = (count / maxCount) * 100;
                        const Icon = STAGE_ICONS[s.key];
                        const isActive = stageFilter.includes(s.key);
                        return (
                          <button
                            key={s.key}
                            onClick={() =>
                              setStageFilter((prev) =>
                                prev.includes(s.key)
                                  ? prev.filter((k) => k !== s.key)
                                  : [...prev, s.key]
                              )
                            }
                            className={`group w-full flex items-center gap-3 text-left transition-all ${
                              stageFilter.length > 0 && !isActive ? "opacity-50" : ""
                            }`}
                          >
                            {/* Icon badge */}
                            <div
                              className={`shrink-0 h-11 w-11 rounded-full flex items-center justify-center ${s.bg} ring-1 ${s.ring}`}
                            >
                              <Icon className="h-6 w-6" style={{ color: s.color }} />
                            </div>

                            {/* Label + bar */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline justify-between gap-2 mb-1">
                                <span className={`text-xs font-bold uppercase tracking-wide ${s.text}`}>
                                  {i + 1}. {s.label}
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  <span className={`text-base font-bold ${s.text}`}>{count}</span>
                                  <span className="ml-1">· {pct.toFixed(1)}%</span>
                                </span>
                              </div>
                              <div className="relative h-6 rounded-full bg-foreground/5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${s.dot} transition-all duration-500 group-hover:brightness-110 flex items-center justify-end pr-2`}
                                  style={{ width: `${Math.max(barPct, count > 0 ? 2 : 0)}%` }}
                                >
                                  {count > 0 && barPct > 15 && (
                                    <span className="text-[10px] font-bold text-white drop-shadow-sm">
                                      {count}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}

                <p className="text-[11px] text-muted-foreground mt-4 text-center">
                  Click any stage to filter the people above · Click again to clear
                </p>
              </CardContent>
            </Card>
          )}

          {/* Maturing & Serving — discipleship + volunteer overview */}
          {!isLoading && total > 0 && (
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Discipleship engagement */}
              <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-sm font-display font-semibold text-foreground">
                        Maturing — Discipleship Engagement
                      </h2>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Where the family is being formed
                      </p>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {total - (discipleshipBreakdown.find((d) => d.short === "—")?.count || 0)}{" "}
                      / {total} engaged
                    </div>
                  </div>
                  {(() => {
                    const maxC = Math.max(...discipleshipBreakdown.map((d) => d.count), 1);
                    return (
                      <div className="space-y-3">
                        {discipleshipBreakdown.map((d) => {
                          const pct = total > 0 ? (d.count / total) * 100 : 0;
                          const barPct = (d.count / maxC) * 100;
                          return (
                            <div key={d.short} className="flex items-center gap-3">
                              <div
                                className={`shrink-0 h-9 w-9 rounded-full flex items-center justify-center ${d.bg}`}
                              >
                                <span
                                  className={`text-[10px] font-bold ${d.text}`}
                                >
                                  {d.short}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline justify-between gap-2 mb-1">
                                  <span className={`text-xs font-semibold ${d.text}`}>
                                    {d.label}
                                  </span>
                                  <span className="text-[11px] text-muted-foreground">
                                    <span className="text-sm font-bold text-foreground">
                                      {d.count}
                                    </span>{" "}
                                    · {pct.toFixed(0)}%
                                  </span>
                                </div>
                                <div className="relative h-5 rounded-full bg-foreground/5 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${d.dot} transition-all duration-500`}
                                    style={{ width: `${Math.max(barPct, d.count > 0 ? 2 : 0)}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Ministering — volunteer engagement */}
              <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-sm font-display font-semibold text-foreground">
                        Ministering — Volunteer Teams
                      </h2>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Where the family is serving
                      </p>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      <span className="text-sm font-bold text-rose-700">
                        {volunteerBreakdown.serving}
                      </span>{" "}
                      / {total} serving
                    </div>
                  </div>
                  {(() => {
                    const teams = volunteerBreakdown.teams;
                    const maxC = Math.max(...teams.map((t) => t.count), 1);
                    if (teams.length === 0) {
                      return (
                        <p className="text-xs text-muted-foreground text-center py-6">
                          No volunteer team data yet.
                        </p>
                      );
                    }
                    return (
                      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                        {teams.map((t) => {
                          const barPct = (t.count / maxC) * 100;
                          return (
                            <div key={t.name} className="flex items-center gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline justify-between gap-2 mb-0.5">
                                  <span className="text-xs font-medium text-foreground truncate">
                                    {t.name}
                                  </span>
                                  <span className="text-[11px] font-bold text-rose-700 shrink-0">
                                    {t.count}
                                  </span>
                                </div>
                                <div className="relative h-3 rounded-full bg-foreground/5 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-rose-400 to-rose-600 transition-all duration-500"
                                    style={{ width: `${Math.max(barPct, 4)}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          )}
        </ScrollArea>
      </main>

      {/* Detail sheet */}
      <Sheet open={!!selectedId} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-4">
                  <Avatar member={selected} size="lg" />
                  <div className="min-w-0">
                    <SheetTitle className="text-xl font-display">
                      {selected.first_name} {selected.last_name}
                    </SheetTitle>
                    <SheetDescription className="text-xs">
                      {selected.household_name || "—"}
                    </SheetDescription>
                    <div className="mt-2">
                      <StageBadge stage={selected.discipleship_stage} />
                    </div>
                  </div>
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-5">
                {/* Stage timing */}
                <div className="bg-muted/40 rounded-xl p-3 text-xs text-muted-foreground">
                  In this stage{" "}
                  <span className="font-medium text-foreground">
                    {formatDistanceToNow(new Date(selected.stage_updated_at))}
                  </span>{" "}
                  · {STAGE_BY_KEY[selected.discipleship_stage].description}
                </div>

                {/* Household bar */}
                {(selected.household_name || selected.household_id || householdMembers.length > 0) && (
                  <div className="rounded-xl border border-border/40 bg-card p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-foreground min-w-0">
                        <Home className="h-3.5 w-3.5 text-prussian shrink-0" />
                        <span className="truncate">
                          Household{selected.household_name ? ` · ${selected.household_name}` : ""}
                        </span>
                      </div>
                      <button
                        onClick={() => setShowHousehold((v) => !v)}
                        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors shrink-0"
                        title={showHousehold ? "Hide household" : "Show household"}
                      >
                        {showHousehold ? (
                          <>
                            <EyeOff className="h-3 w-3" /> Hide
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3" /> Show ({householdMembers.length})
                          </>
                        )}
                      </button>
                    </div>
                    {showHousehold && (householdMembers.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground italic">
                        No other household members on file.
                      </p>
                    ) : (
                      <ul className="space-y-1">
                        {householdMembers.map((hm) => (
                          <li key={hm.id}>
                            <button
                              onClick={() => {
                                setSelectedId(hm.id);
                                setStageNote("");
                              }}
                              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/60 transition-colors text-left"
                            >
                              <Avatar member={hm} size="sm" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-foreground truncate">
                                  {hm.first_name} {hm.last_name}
                                </p>
                              </div>
                              <StageBadge stage={hm.discipleship_stage} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ))}
                  </div>
                )}

                {/* Discipleship & Serving */}
                {(() => {
                  const dTags = getDiscipleshipTags(selected.groups);
                  const vRoles = getVolunteerRoles(selected.groups);
                  return (
                    <div className="rounded-2xl border border-border/40 p-4 space-y-3">
                      <div>
                        <h3 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                          <BookOpenIcon className="h-3.5 w-3.5 text-emerald-600" />
                          Maturing in
                        </h3>
                        {dTags.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {dTags.map((d) => (
                              <span
                                key={d.short}
                                className={`text-[11px] font-semibold px-2 py-1 rounded-lg ${d.bg} ${d.text}`}
                              >
                                {d.label}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] italic text-muted-foreground">
                            Not yet in a discipleship group
                          </p>
                        )}
                      </div>
                      <div className="border-t border-border/40 pt-3">
                        <h3 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                          <HandHeartIcon className="h-3.5 w-3.5 text-rose-600" />
                          Ministering on
                        </h3>
                        {vRoles.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {vRoles.map((r) => (
                              <span
                                key={r}
                                className="text-[11px] font-medium px-2 py-1 rounded-lg bg-rose-100 text-rose-800"
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] italic text-muted-foreground">
                            Not currently serving on a team
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Quick actions */}
                {nextStage && (
                  <Button
                    onClick={() => updateStage(nextStage.key)}
                    disabled={savingStage}
                    className="w-full gap-2 rounded-xl bg-gold hover:bg-gold/90 text-prussian font-semibold"
                  >
                    Move to {nextStage.label}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}

                {/* Reassign to any stage */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">
                    Reassign stage
                  </label>
                  {/* Personal journey roadmap — completed stages are filled in */}
                  <div className="relative pt-1">
                    {/* Connecting road behind the milestones */}
                    <div className="absolute left-[8%] right-[8%] top-[26px] h-[3px] rounded-full bg-foreground/10" />
                    <div
                      className="absolute left-[8%] top-[26px] h-[3px] rounded-full bg-gradient-to-r from-slate-400 via-emerald-400 to-rose-500 transition-all"
                      style={{
                        width: `${
                          currentStageIdx > 0
                            ? (currentStageIdx / (STAGES.length - 1)) * 84
                            : 0
                        }%`,
                      }}
                    />
                    <div className="grid grid-cols-5 gap-1 relative">
                      {STAGES.map((s, i) => {
                        const Icon = STAGE_ICONS[s.key];
                        const active = s.key === selected.discipleship_stage;
                        const completed = currentStageIdx >= 0 && i < currentStageIdx;
                        const reached = completed || active;
                        return (
                          <button
                            key={s.key}
                            onClick={() => updateStage(s.key)}
                            disabled={savingStage}
                            title={
                              completed
                                ? `Journeyed through ${s.label}`
                                : active
                                ? `Currently ${s.label}`
                                : `Not yet ${s.label}`
                            }
                            className={`relative flex flex-col items-center px-1 pt-1 pb-1.5 rounded-xl transition-all ${
                              active ? "scale-[1.05]" : "hover:scale-[1.03]"
                            } ${!reached ? "opacity-55 hover:opacity-90" : ""}`}
                          >
                            <div
                              className={`relative z-10 h-12 w-12 rounded-full flex items-center justify-center transition-all ${
                                reached
                                  ? `${s.bg} shadow-sm ring-2 ring-white`
                                  : "bg-background ring-2 border-2 border-dashed border-foreground/25"
                              } ${active ? `ring-[3px] ${s.ring} shadow-md` : ""}`}
                            >
                              <Icon
                                className="h-6 w-6"
                                style={{
                                  color: reached ? s.color : "hsl(var(--muted-foreground))",
                                  opacity: reached ? 1 : 0.5,
                                }}
                              />
                              {completed && (
                                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center shadow ring-1 ring-white">
                                  ✓
                                </span>
                              )}
                              {active && (
                                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-foreground shadow" />
                              )}
                            </div>
                            <span
                              className={`mt-1.5 text-[9px] font-bold uppercase tracking-wide ${
                                reached ? s.text : "text-muted-foreground"
                              }`}
                            >
                              {s.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center">
                    {currentStageIdx >= 0 && (
                      <>
                        <span className="font-semibold text-foreground/80">
                          {currentStageIdx + 1} of {STAGES.length}
                        </span>{" "}
                        milestones reached · tap any stage to reassign
                      </>
                    )}
                  </p>
                </div>

                {/* Note */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">
                    Pastoral note (saved with stage change)
                  </label>
                  <Textarea
                    value={stageNote}
                    onChange={(e) => setStageNote(e.target.value)}
                    placeholder="What prompted this update? Conversations, milestones, prayer requests..."
                    rows={3}
                    className="rounded-xl text-sm"
                  />
                </div>

                {/* Contact */}
                {(selected.email || selected.phone) && (
                  <div className="text-xs text-muted-foreground space-y-1 border-t border-border/40 pt-4">
                    {selected.email && <div>{selected.email}</div>}
                    {selected.phone && <div>{selected.phone}</div>}
                  </div>
                )}

                {/* History */}
                <div className="space-y-2 border-t border-border/40 pt-4">
                  <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">
                    Stage history
                  </h3>
                  {selectedHistory.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">
                      No stage changes recorded yet.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {selectedHistory.map((h) => (
                        <li
                          key={h.id}
                          className="text-xs bg-muted/30 rounded-lg p-2.5 space-y-1"
                        >
                          <div className="flex items-center gap-1.5">
                            {h.previous_stage && (
                              <>
                                <StageBadge stage={h.previous_stage} />
                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              </>
                            )}
                            <StageBadge stage={h.new_stage} />
                            <span className="ml-auto text-muted-foreground text-[10px]">
                              {formatDistanceToNow(new Date(h.changed_at), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                          {h.notes && (
                            <p className="text-foreground/80 leading-snug">
                              {h.notes}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MembersPage;
