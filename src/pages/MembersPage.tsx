import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users, Search, RefreshCw, BookOpen, Heart, Mail, Phone,
  MapPin, Calendar, User, Home, ChevronDown, ChevronRight
} from "lucide-react";
import { toast } from "sonner";

type MemberGroup = { group_name: string; group_type: string };
type MemberWithGroups = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  gender: string | null;
  date_of_birth: string | null;
  membership_status: string;
  membership_date: string;
  address: string | null;
  notes: string | null;
  photo_url: string | null;
  pco_id: string | null;
  household_id: string | null;
  household_name: string | null;
  groups: MemberGroup[];
};

const CATEGORY_FILTERS = [
  { value: "members", label: "Members & Dependants" },
  { value: "regular", label: "Regular Attenders" },
  { value: "all", label: "All People" },
];

const MEMBERSHIP_LIST_MAP: Record<string, string[]> = {
  members: ["Member Adults", "Member Children"],
  regular: ["Regular Attender Adults", "Regular Attender Children"],
};

const MembersPage = () => {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("members");
  const [importing, setImporting] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [expandedHouseholds, setExpandedHouseholds] = useState<Set<string>>(new Set());

  const { data: members = [], isLoading, refetch } = useQuery({
    queryKey: ["members-with-groups"],
    queryFn: async () => {
      const { data: membersData, error } = await supabase
        .from("members")
        .select("*")
        .order("last_name", { ascending: true });
      if (error) throw error;

      const { data: groupsData } = await supabase.from("member_groups").select("*");

      const groupsByMember = new Map<string, MemberGroup[]>();
      for (const g of groupsData || []) {
        const existing = groupsByMember.get(g.member_id) || [];
        existing.push({ group_name: g.group_name, group_type: g.group_type });
        groupsByMember.set(g.member_id, existing);
      }

      return (membersData || []).map((m: any) => ({
        ...m,
        groups: groupsByMember.get(m.id) || [],
      })) as MemberWithGroups[];
    },
  });

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const matchesSearch =
        !search ||
        `${m.first_name} ${m.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
        (m.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (m.household_name || "").toLowerCase().includes(search.toLowerCase());
      if (categoryFilter !== "all") {
        const requiredLists = MEMBERSHIP_LIST_MAP[categoryFilter] || [];
        const membershipGroups = m.groups
          .filter((g) => g.group_type === "membership")
          .map((g) => g.group_name);
        if (!requiredLists.some((l) => membershipGroups.includes(l))) return false;
      }
      return matchesSearch;
    });
  }, [members, search, categoryFilter]);

  // Group filtered members by household
  const householdGroups = useMemo(() => {
    const hMap = new Map<string, { name: string; members: MemberWithGroups[] }>();
    const noHousehold: MemberWithGroups[] = [];
    for (const m of filtered) {
      if (m.household_id) {
        const existing = hMap.get(m.household_id);
        if (existing) {
          existing.members.push(m);
        } else {
          hMap.set(m.household_id, { name: m.household_name || "Unnamed Household", members: [m] });
        }
      } else {
        noHousehold.push(m);
      }
    }
    const sorted = Array.from(hMap.entries()).sort((a, b) => a[1].name.localeCompare(b[1].name));
    return { households: sorted, individuals: noHousehold };
  }, [filtered]);

  const selectedMember = useMemo(
    () => members.find((m) => m.id === selectedMemberId) || null,
    [members, selectedMemberId]
  );

  const stats = useMemo(() => {
    const count = (list: string) => members.filter((m) => m.groups.some((g) => g.group_name === list)).length;
    return {
      memberAdults: count("Member Adults"),
      memberChildren: count("Member Children"),
      regularAdults: count("Regular Attender Adults"),
      regularChildren: count("Regular Attender Children"),
      volunteering: members.filter((m) => m.groups.some((g) => g.group_type === "volunteer")).length,
      inDiscipleship: members.filter((m) => m.groups.some((g) => g.group_type === "discipleship")).length,
      total: members.length,
      households: new Set(members.filter((m) => m.household_id).map((m) => m.household_id)).size,
    };
  }, [members]);

  const handleSync = async () => {
    setImporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Not authenticated"); return; }
      const { data, error } = await supabase.functions.invoke("import-planning-center-people", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      toast.success(data.message || "Import complete");
      refetch();
    } catch (e: any) {
      toast.error(e.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const getInitials = (first: string, last: string) =>
    `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase();

  const getVolunteerGroups = (m: MemberWithGroups) =>
    m.groups.filter((g) => g.group_type === "volunteer");

  const getDiscipleshipGroups = (m: MemberWithGroups) =>
    m.groups.filter((g) => g.group_type === "discipleship");

  const getMembershipCategory = (m: MemberWithGroups) => {
    const cats = m.groups.filter((g) => g.group_type === "membership").map((g) => g.group_name);
    if (cats.includes("Member Adults")) return "Member";
    if (cats.includes("Member Children")) return "Child";
    if (cats.includes("Regular Attender Adults")) return "Regular";
    if (cats.includes("Regular Attender Children")) return "Reg. Child";
    return "Other";
  };

  const getConnectionScore = (m: MemberWithGroups) => {
    let score = 0;
    if (getVolunteerGroups(m).length > 0) score++;
    if (getDiscipleshipGroups(m).length > 0) score++;
    if (m.email) score++;
    if (m.phone) score++;
    return score;
  };

  const getConnectionLabel = (score: number) => {
    if (score >= 4) return { label: "Well Connected", color: "bg-emerald-500", textColor: "text-emerald-700" };
    if (score >= 3) return { label: "Connected", color: "bg-emerald-400", textColor: "text-emerald-600" };
    if (score >= 2) return { label: "Partial", color: "bg-amber-400", textColor: "text-amber-600" };
    return { label: "Needs Connection", color: "bg-red-400", textColor: "text-red-600" };
  };

  const toggleHousehold = (id: string) => {
    setExpandedHouseholds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Get household members for selected member
  const householdMembers = useMemo(() => {
    if (!selectedMember?.household_id) return [];
    return members.filter(
      (m) => m.household_id === selectedMember.household_id && m.id !== selectedMember.id
    );
  }, [selectedMember, members]);

  const renderMemberRow = (m: MemberWithGroups) => {
    const conn = getConnectionLabel(getConnectionScore(m));
    const isSelected = selectedMemberId === m.id;
    return (
      <button
        key={m.id}
        onClick={() => setSelectedMemberId(m.id)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-xl transition-all duration-150 ${
          isSelected
            ? "bg-primary/10 ring-1 ring-primary/20"
            : "hover:bg-muted/60"
        }`}
      >
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-xs font-semibold text-primary">
            {getInitials(m.first_name, m.last_name)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {m.first_name} {m.last_name}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 font-normal border-border/50">
              {getMembershipCategory(m)}
            </Badge>
            <div className={`h-1.5 w-1.5 rounded-full ${conn.color}`} />
          </div>
        </div>
        {(getVolunteerGroups(m).length > 0 || getDiscipleshipGroups(m).length > 0) && (
          <div className="flex gap-0.5 shrink-0">
            {getVolunteerGroups(m).length > 0 && (
              <span className="text-emerald-500 text-xs">🤝</span>
            )}
            {getDiscipleshipGroups(m).length > 0 && (
              <span className="text-violet-500 text-xs">📖</span>
            )}
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <main className="flex-1 ml-[72px] flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-3 space-y-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Church Family</h1>
              <p className="text-sm text-muted-foreground">
                {stats.total} people · {stats.households} households
              </p>
            </div>
            <Button onClick={handleSync} disabled={importing} variant="outline" className="gap-2 rounded-xl">
              <RefreshCw className={`h-4 w-4 ${importing ? "animate-spin" : ""}`} />
              {importing ? "Syncing..." : "Sync from PCO"}
            </Button>
          </div>

          {/* Stats ribbon */}
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {[
              { label: "Adults", value: stats.memberAdults, icon: Users, accent: "bg-primary/10 text-primary" },
              { label: "Children", value: stats.memberChildren, icon: User, accent: "bg-amber-500/10 text-amber-600" },
              { label: "Reg. Adults", value: stats.regularAdults, icon: Users, accent: "bg-blue-500/10 text-blue-600" },
              { label: "Reg. Children", value: stats.regularChildren, icon: User, accent: "bg-sky-500/10 text-sky-600" },
              { label: "Volunteers", value: stats.volunteering, icon: Heart, accent: "bg-emerald-500/10 text-emerald-600" },
              { label: "In Groups", value: stats.inDiscipleship, icon: BookOpen, accent: "bg-violet-500/10 text-violet-600" },
              { label: "Households", value: stats.households, icon: Home, accent: "bg-orange-500/10 text-orange-600" },
              { label: "Total", value: stats.total, icon: Users, accent: "bg-muted text-muted-foreground" },
            ].map((s) => (
              <Card key={s.label} className="border-none shadow-sm rounded-xl">
                <CardContent className="p-2.5 flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${s.accent}`}>
                    <s.icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-bold text-foreground leading-tight">{s.value}</p>
                    <p className="text-[9px] text-muted-foreground truncate">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Main content: left list + right detail */}
        <div className="flex-1 flex gap-0 overflow-hidden px-6 pb-4">
          {/* LEFT: Contact list */}
          <div className="w-[340px] shrink-0 flex flex-col border rounded-2xl bg-card mr-4 overflow-hidden">
            {/* Search + filter */}
            <div className="p-3 space-y-2 border-b">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search name, email, household..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-sm rounded-lg"
                />
              </div>
              <div className="flex items-center gap-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-7 text-xs rounded-lg flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_FILTERS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{filtered.length}</span>
              </div>
            </div>

            {/* Scrollable list */}
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-0.5">
                {isLoading ? (
                  <p className="text-center py-8 text-sm text-muted-foreground">Loading...</p>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {members.length === 0 ? 'Click "Sync from PCO" to import' : "No results"}
                    </p>
                  </div>
                ) : (
                  <>
                    {householdGroups.households.map(([hhId, hh]) => {
                      const isExpanded = expandedHouseholds.has(hhId);
                      return (
                        <div key={hhId} className="mb-1">
                          <button
                            onClick={() => toggleHousehold(hhId)}
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-left rounded-lg hover:bg-muted/40 transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                            ) : (
                              <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                            )}
                            <Home className="h-3 w-3 text-orange-500 shrink-0" />
                            <span className="text-xs font-medium text-foreground truncate">{hh.name}</span>
                            <span className="text-[10px] text-muted-foreground ml-auto shrink-0">{hh.members.length}</span>
                          </button>
                          {isExpanded && (
                            <div className="ml-4 space-y-0.5">
                              {hh.members.map(renderMemberRow)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {householdGroups.individuals.length > 0 && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground px-2 mb-1 font-medium">
                          No Household
                        </p>
                        {householdGroups.individuals.map(renderMemberRow)}
                      </div>
                    )}
                  </>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* RIGHT: Detail panel */}
          <div className="flex-1 overflow-auto">
            {!selectedMember ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <User className="h-16 w-16 mx-auto text-muted-foreground/20 mb-3" />
                  <p className="text-muted-foreground text-sm">Select a person to see their connection profile</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Person header card */}
                <Card className="border-none shadow-md rounded-2xl overflow-hidden">
                  <CardContent className="p-0">
                    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
                      <div className="flex items-start gap-5">
                        <div className="h-20 w-20 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
                          <span className="text-2xl font-bold text-primary">
                            {getInitials(selectedMember.first_name, selectedMember.last_name)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h2 className="text-xl font-bold text-foreground">
                            {selectedMember.first_name} {selectedMember.last_name}
                          </h2>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs font-normal">
                              {getMembershipCategory(selectedMember)}
                            </Badge>
                            {(() => {
                              const conn = getConnectionLabel(getConnectionScore(selectedMember));
                              return (
                                <Badge className={`text-xs border-0 ${conn.color} text-white`}>
                                  {conn.label}
                                </Badge>
                              );
                            })()}
                          </div>
                          {selectedMember.household_name && (
                            <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-1.5">
                              <Home className="h-3.5 w-3.5" />
                              {selectedMember.household_name} Household
                            </p>
                          )}
                        </div>
                        {/* Connection score ring */}
                        <div className="shrink-0 text-center">
                          <div className="relative h-16 w-16">
                            <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                              <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="hsl(var(--muted))"
                                strokeWidth="3"
                              />
                              <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="hsl(var(--primary))"
                                strokeWidth="3"
                                strokeDasharray={`${(getConnectionScore(selectedMember) / 4) * 100}, 100`}
                              />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-foreground">
                              {getConnectionScore(selectedMember)}/4
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Connection</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Contact info */}
                  <Card className="border-none shadow-sm rounded-2xl">
                    <CardContent className="p-5">
                      <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3 tracking-wide">
                        Contact Information
                      </h4>
                      <div className="space-y-3">
                        {selectedMember.email ? (
                          <a href={`mailto:${selectedMember.email}`} className="flex items-center gap-2.5 text-sm text-foreground hover:text-primary transition-colors">
                            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                              <Mail className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="truncate">{selectedMember.email}</span>
                          </a>
                        ) : (
                          <div className="flex items-center gap-2.5 text-sm text-muted-foreground/50">
                            <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                              <Mail className="h-4 w-4" />
                            </div>
                            <span className="italic">No email on file</span>
                          </div>
                        )}
                        {selectedMember.phone ? (
                          <a href={`tel:${selectedMember.phone}`} className="flex items-center gap-2.5 text-sm text-foreground hover:text-primary transition-colors">
                            <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                              <Phone className="h-4 w-4 text-green-600" />
                            </div>
                            <span>{selectedMember.phone}</span>
                          </a>
                        ) : (
                          <div className="flex items-center gap-2.5 text-sm text-muted-foreground/50">
                            <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                              <Phone className="h-4 w-4" />
                            </div>
                            <span className="italic">No phone on file</span>
                          </div>
                        )}
                        {selectedMember.address && (
                          <div className="flex items-center gap-2.5 text-sm text-foreground">
                            <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                              <MapPin className="h-4 w-4 text-orange-600" />
                            </div>
                            <span>{selectedMember.address}</span>
                          </div>
                        )}
                        {selectedMember.date_of_birth && (
                          <div className="flex items-center gap-2.5 text-sm text-foreground">
                            <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                              <Calendar className="h-4 w-4 text-purple-600" />
                            </div>
                            <span>
                              {new Date(selectedMember.date_of_birth).toLocaleDateString("en-US", {
                                month: "long", day: "numeric", year: "numeric",
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Household */}
                  <Card className="border-none shadow-sm rounded-2xl">
                    <CardContent className="p-5">
                      <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3 tracking-wide">
                        Household
                      </h4>
                      {selectedMember.household_name ? (
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                              <Home className="h-4 w-4 text-orange-600" />
                            </div>
                            <span className="text-sm font-medium">{selectedMember.household_name}</span>
                          </div>
                          {householdMembers.map((hm) => (
                            <button
                              key={hm.id}
                              onClick={() => setSelectedMemberId(hm.id)}
                              className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                            >
                              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-semibold text-primary">
                                  {getInitials(hm.first_name, hm.last_name)}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm text-foreground truncate">{hm.first_name} {hm.last_name}</p>
                                <p className="text-[10px] text-muted-foreground">{getMembershipCategory(hm)}</p>
                              </div>
                            </button>
                          ))}
                          {householdMembers.length === 0 && (
                            <p className="text-sm text-muted-foreground italic">Only member in household</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No household assigned</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Volunteering & Discipleship */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="border-none shadow-sm rounded-2xl">
                    <CardContent className="p-5">
                      <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3 tracking-wide flex items-center gap-1.5">
                        <Heart className="h-3.5 w-3.5 text-emerald-500" /> Serving Teams
                      </h4>
                      {getVolunteerGroups(selectedMember).length > 0 ? (
                        <div className="space-y-2">
                          {getVolunteerGroups(selectedMember).map((g) => (
                            <div
                              key={g.group_name}
                              className="flex items-center gap-2.5 p-2.5 rounded-xl bg-emerald-500/5"
                            >
                              <div className="h-8 w-8 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
                                <Heart className="h-4 w-4 text-emerald-600" />
                              </div>
                              <span className="text-sm font-medium text-foreground">{g.group_name}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-muted/30 text-center">
                          <Heart className="h-8 w-8 mx-auto text-muted-foreground/20 mb-1.5" />
                          <p className="text-sm text-muted-foreground">Not serving on a team</p>
                          <p className="text-[11px] text-muted-foreground/60 mt-0.5">Opportunity to invite!</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm rounded-2xl">
                    <CardContent className="p-5">
                      <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3 tracking-wide flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5 text-violet-500" /> Discipleship Groups
                      </h4>
                      {getDiscipleshipGroups(selectedMember).length > 0 ? (
                        <div className="space-y-2">
                          {getDiscipleshipGroups(selectedMember).map((g) => (
                            <div
                              key={g.group_name}
                              className="flex items-center gap-2.5 p-2.5 rounded-xl bg-violet-500/5"
                            >
                              <div className="h-8 w-8 rounded-lg bg-violet-500/15 flex items-center justify-center shrink-0">
                                <BookOpen className="h-4 w-4 text-violet-600" />
                              </div>
                              <span className="text-sm font-medium text-foreground">{g.group_name}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-muted/30 text-center">
                          <BookOpen className="h-8 w-8 mx-auto text-muted-foreground/20 mb-1.5" />
                          <p className="text-sm text-muted-foreground">Not in a group</p>
                          <p className="text-[11px] text-muted-foreground/60 mt-0.5">Great candidate to connect!</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MembersPage;
