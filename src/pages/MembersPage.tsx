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
    color: "hsl(25, 90%, 50%)",
    bg: "bg-orange-100",
    ring: "ring-orange-300",
    text: "text-orange-800",
    dot: "bg-orange-500",
  },
  {
    key: "multiplying",
    label: "Multiplying",
    description: "On mission, discipling others, reproducing disciples",
    color: "hsl(43, 74%, 49%)",
    bg: "bg-amber-100",
    ring: "ring-amber-300",
    text: "text-amber-900",
    dot: "bg-amber-500",
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
  const [stageFilter, setStageFilter] = useState<StageKey | null>(null);
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
    for (const m of churchFamily) counts[m.discipleship_stage]++;
    return counts;
  }, [churchFamily]);

  const total = churchFamily.length;

  // Filter list
  const filtered = useMemo(() => {
    return churchFamily.filter((m) => {
      if (stageFilter && m.discipleship_stage !== stageFilter) return false;
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
                    const isActive = stageFilter === s.key;
                    const isFinal = i === STAGES.length - 1;
                    const Icon = STAGE_ICONS[s.key];
                    // Milestone is "reached" if anyone in the (filtered) set is at this stage
                    // or has progressed beyond it.
                    const reached = STAGES.slice(i).some((later) => stageCounts[later.key] > 0);
                    return (
                      <button
                        key={s.key}
                        onClick={() => setStageFilter(isActive ? null : s.key)}
                        title={s.description}
                        className={`group relative flex flex-col items-center text-center px-2 pt-1 pb-2 rounded-xl transition-all ${
                          isActive ? "scale-[1.04]" : "hover:scale-[1.02]"
                        } ${stageFilter && !isActive ? "opacity-55" : ""}`}
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
                          {/* step number badge */}
                          <span
                            className={`absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-white shadow text-[10px] font-bold flex items-center justify-center ${
                              reached ? s.text : "text-muted-foreground"
                            }`}
                          >
                            {i + 1}
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

                        {/* Stat */}
                        <div className="mt-1 flex items-baseline gap-1">
                          <span className={`text-xl font-bold ${s.text}`}>{count}</span>
                          <span className="text-[10px] text-muted-foreground">
                            · {pct}%
                          </span>
                        </div>

                        {/* Mini progress bar showing how full this stage is */}
                        <div className="mt-1 h-1 w-full max-w-[120px] rounded-full bg-foreground/5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${s.dot} transition-all`}
                            style={{ width: `${Math.max(pct, count > 0 ? 4 : 0)}%` }}
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
            {stageFilter && (
              <button
                onClick={() => setStageFilter(null)}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
              >
                Clear stage filter
              </button>
            )}
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
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedId(m.id);
                      setStageNote("");
                    }}
                    className="text-left bg-card rounded-2xl border border-border/40 hover:border-prussian/30 hover:shadow-md transition-all p-4 flex items-start gap-3"
                  >
                    <Avatar member={m} size="md" />
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
                      </div>
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Updated{" "}
                        {formatDistanceToNow(new Date(m.stage_updated_at), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                  </button>
                );
              })}
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
                  <div className="grid grid-cols-5 gap-1.5">
                    {STAGES.map((s) => {
                      const active = s.key === selected.discipleship_stage;
                      return (
                        <button
                          key={s.key}
                          onClick={() => updateStage(s.key)}
                          disabled={savingStage}
                          className={`px-2 py-2 rounded-xl text-[10px] font-medium transition-all ${
                            s.bg
                          } ${s.text} ${
                            active
                              ? `ring-2 ${s.ring} shadow-sm`
                              : "hover:shadow-sm opacity-70 hover:opacity-100"
                          }`}
                          title={s.description}
                        >
                          <div className={`h-1.5 w-1.5 rounded-full ${s.dot} mx-auto mb-1`} />
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
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
