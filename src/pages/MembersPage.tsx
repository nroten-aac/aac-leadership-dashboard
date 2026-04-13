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

const Avatar = ({ member, size = "md" }: { member: MemberWithGroups; size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = { sm: "h-8 w-8 text-[10px]", md: "h-11 w-11 text-sm", lg: "h-20 w-20 text-2xl" };
  const initials = `${member.first_name?.[0] || ""}${member.last_name?.[0] || ""}`.toUpperCase();

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
    <div className={`${sizeClasses[size]} rounded-full bg-prussian/10 flex items-center justify-center shrink-0 ring-2 ring-white shadow-sm`}>
      <span className="font-semibold text-prussian">{initials}</span>
    </div>
  );
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

  const householdGroups = useMemo(() => {
    const hMap = new Map<string, { name: string; members: MemberWithGroups[] }>();
    const noHousehold: MemberWithGroups[] = [];
    for (const m of filtered) {
      if (m.household_id) {
        const existing = hMap.get(m.household_id);
        if (existing) existing.members.push(m);
        else hMap.set(m.household_id, { name: m.household_name || "Unnamed Household", members: [m] });
      } else {
        noHousehold.push(m);
      }
    }
    return { households: Array.from(hMap.entries()).sort((a, b) => a[1].name.localeCompare(b[1].name)), individuals: noHousehold };
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

  const getVolunteerGroups = (m: MemberWithGroups) => m.groups.filter((g) => g.group_type === "volunteer");
  const getDiscipleshipGroups = (m: MemberWithGroups) => m.groups.filter((g) => g.group_type === "discipleship");

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
    if (score >= 4) return { label: "Well Connected", bg: "bg-emerald-500", text: "text-emerald-700" };
    if (score >= 3) return { label: "Connected", bg: "bg-sky", text: "text-sky" };
    if (score >= 2) return { label: "Partial", bg: "bg-gold", text: "text-gold" };
    return { label: "Needs Connection", bg: "bg-destructive", text: "text-destructive" };
  };

  const toggleHousehold = (id: string) => {
    setExpandedHouseholds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const householdMembers = useMemo(() => {
    if (!selectedMember?.household_id) return [];
    return members.filter((m) => m.household_id === selectedMember.household_id && m.id !== selectedMember.id);
  }, [selectedMember, members]);

  const renderMemberRow = (m: MemberWithGroups) => {
    const isSelected = selectedMemberId === m.id;
    const conn = getConnectionLabel(getConnectionScore(m));
    return (
      <button
        key={m.id}
        onClick={() => setSelectedMemberId(m.id)}
        className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-left rounded-xl transition-all duration-150 ${
          isSelected ? "bg-prussian/10 ring-1 ring-prussian/20" : "hover:bg-muted/60"
        }`}
      >
        <Avatar member={m} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {m.first_name} {m.last_name}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 font-normal border-border/50">
              {getMembershipCategory(m)}
            </Badge>
            <div className={`h-1.5 w-1.5 rounded-full ${conn.bg}`} />
          </div>
        </div>
        {(getVolunteerGroups(m).length > 0 || getDiscipleshipGroups(m).length > 0) && (
          <div className="flex gap-0.5 shrink-0">
            {getVolunteerGroups(m).length > 0 && <Heart className="h-3 w-3 text-emerald-500" />}
            {getDiscipleshipGroups(m).length > 0 && <BookOpen className="h-3 w-3 text-secondary" />}
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
              <h1 className="text-2xl font-display font-bold text-foreground">Church Family</h1>
              <p className="text-sm text-muted-foreground">
                {stats.total} people · {stats.households} households
              </p>
            </div>
            <Button onClick={handleSync} disabled={importing} className="gap-2 rounded-xl bg-prussian hover:bg-prussian/90 text-primary-foreground">
              <RefreshCw className={`h-4 w-4 ${importing ? "animate-spin" : ""}`} />
              {importing ? "Syncing..." : "Sync from PCO"}
            </Button>
          </div>

          {/* Stats ribbon - branded */}
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {[
              { label: "Adults", value: stats.memberAdults, icon: Users, bg: "bg-prussian/10", iconColor: "text-prussian" },
              { label: "Children", value: stats.memberChildren, icon: User, bg: "bg-gold/15", iconColor: "text-gold" },
              { label: "Reg. Adults", value: stats.regularAdults, icon: Users, bg: "bg-sky/10", iconColor: "text-sky" },
              { label: "Reg. Children", value: stats.regularChildren, icon: User, bg: "bg-sky/10", iconColor: "text-sky" },
              { label: "Volunteers", value: stats.volunteering, icon: Heart, bg: "bg-emerald-500/10", iconColor: "text-emerald-600" },
              { label: "In Groups", value: stats.inDiscipleship, icon: BookOpen, bg: "bg-secondary/10", iconColor: "text-secondary" },
              { label: "Households", value: stats.households, icon: Home, bg: "bg-gold/15", iconColor: "text-gold" },
              { label: "Total", value: stats.total, icon: Users, bg: "bg-prussian/10", iconColor: "text-prussian" },
            ].map((s) => (
              <Card key={s.label} className="border-none shadow-sm rounded-xl">
                <CardContent className="p-2.5 flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${s.bg}`}>
                    <s.icon className={`h-3.5 w-3.5 ${s.iconColor}`} />
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

        {/* Main content */}
        <div className="flex-1 flex gap-0 overflow-hidden px-6 pb-4">
          {/* LEFT: Contact list */}
          <div className="w-[340px] shrink-0 flex flex-col border border-border/50 rounded-2xl bg-card mr-4 overflow-hidden shadow-sm">
            <div className="p-3 space-y-2 border-b border-border/50">
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
                        <div key={hhId} className="mb-0.5">
                          <button
                            onClick={() => toggleHousehold(hhId)}
                            className="w-full flex items-center gap-2 px-2 py-1.5 text-left rounded-lg hover:bg-muted/40 transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                            ) : (
                              <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                            )}
                            <Home className="h-3 w-3 text-gold shrink-0" />
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
                      <div className="mt-2 pt-2 border-t border-border/50">
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
                  <div className="h-20 w-20 mx-auto rounded-2xl bg-prussian/5 flex items-center justify-center mb-4">
                    <User className="h-10 w-10 text-prussian/20" />
                  </div>
                  <p className="text-muted-foreground text-sm font-display">Select a person to see their connection profile</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Person header */}
                <Card className="border-none shadow-md rounded-2xl overflow-hidden">
                  <CardContent className="p-0">
                    <div className="bg-gradient-to-br from-prussian via-prussian/90 to-secondary p-6">
                      <div className="flex items-start gap-5">
                        <Avatar member={selectedMember} size="lg" />
                        <div className="flex-1 min-w-0">
                          <h2 className="text-xl font-display font-bold text-white">
                            {selectedMember.first_name} {selectedMember.last_name}
                          </h2>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge className="text-xs font-normal bg-white/20 text-white border-0 hover:bg-white/30">
                              {getMembershipCategory(selectedMember)}
                            </Badge>
                            {(() => {
                              const conn = getConnectionLabel(getConnectionScore(selectedMember));
                              return (
                                <Badge className={`text-xs border-0 ${
                                  getConnectionScore(selectedMember) >= 4 ? "bg-emerald-500" :
                                  getConnectionScore(selectedMember) >= 3 ? "bg-sky" :
                                  getConnectionScore(selectedMember) >= 2 ? "bg-gold text-ivory-black" :
                                  "bg-destructive"
                                } text-white`}>
                                  {conn.label}
                                </Badge>
                              );
                            })()}
                          </div>
                          {selectedMember.household_name && (
                            <p className="text-sm text-white/70 mt-1.5 flex items-center gap-1.5">
                              <Home className="h-3.5 w-3.5" />
                              {selectedMember.household_name}
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
                                stroke="rgba(255,255,255,0.2)"
                                strokeWidth="3"
                              />
                              <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="hsl(var(--gold))"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeDasharray={`${(getConnectionScore(selectedMember) / 4) * 100}, 100`}
                              />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white">
                              {getConnectionScore(selectedMember)}/4
                            </span>
                          </div>
                          <p className="text-[10px] text-white/60 mt-0.5">Connection</p>
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
                      <h4 className="text-xs font-display font-semibold uppercase text-muted-foreground mb-3 tracking-wide">
                        Contact Information
                      </h4>
                      <div className="space-y-3">
                        {selectedMember.email ? (
                          <a href={`mailto:${selectedMember.email}`} className="flex items-center gap-2.5 text-sm text-foreground hover:text-prussian transition-colors">
                            <div className="h-8 w-8 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                              <Mail className="h-4 w-4 text-secondary" />
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
                          <a href={`tel:${selectedMember.phone}`} className="flex items-center gap-2.5 text-sm text-foreground hover:text-prussian transition-colors">
                            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                              <Phone className="h-4 w-4 text-emerald-600" />
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
                            <div className="h-8 w-8 rounded-lg bg-gold/15 flex items-center justify-center shrink-0">
                              <MapPin className="h-4 w-4 text-gold" />
                            </div>
                            <span>{selectedMember.address}</span>
                          </div>
                        )}
                        {selectedMember.date_of_birth && (
                          <div className="flex items-center gap-2.5 text-sm text-foreground">
                            <div className="h-8 w-8 rounded-lg bg-prussian/10 flex items-center justify-center shrink-0">
                              <Calendar className="h-4 w-4 text-prussian" />
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
                      <h4 className="text-xs font-display font-semibold uppercase text-muted-foreground mb-3 tracking-wide">
                        Household
                      </h4>
                      {selectedMember.household_name ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="h-8 w-8 rounded-lg bg-gold/15 flex items-center justify-center">
                              <Home className="h-4 w-4 text-gold" />
                            </div>
                            <span className="text-sm font-medium">{selectedMember.household_name}</span>
                          </div>
                          {householdMembers.map((hm) => (
                            <button
                              key={hm.id}
                              onClick={() => setSelectedMemberId(hm.id)}
                              className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted/50 transition-colors text-left"
                            >
                              <Avatar member={hm} size="sm" />
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
                      <h4 className="text-xs font-display font-semibold uppercase text-muted-foreground mb-3 tracking-wide flex items-center gap-1.5">
                        <Heart className="h-3.5 w-3.5 text-emerald-500" /> Serving Teams
                      </h4>
                      {getVolunteerGroups(selectedMember).length > 0 ? (
                        <div className="space-y-2">
                          {getVolunteerGroups(selectedMember).map((g) => (
                            <div key={g.group_name} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                              <div className="h-8 w-8 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
                                <Heart className="h-4 w-4 text-emerald-600" />
                              </div>
                              <span className="text-sm font-medium text-foreground">{g.group_name}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-muted/30 text-center border border-dashed border-border/50">
                          <Heart className="h-8 w-8 mx-auto text-muted-foreground/20 mb-1.5" />
                          <p className="text-sm text-muted-foreground">Not serving on a team</p>
                          <p className="text-[11px] text-muted-foreground/60 mt-0.5">Opportunity to invite!</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm rounded-2xl">
                    <CardContent className="p-5">
                      <h4 className="text-xs font-display font-semibold uppercase text-muted-foreground mb-3 tracking-wide flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5 text-secondary" /> Discipleship Groups
                      </h4>
                      {getDiscipleshipGroups(selectedMember).length > 0 ? (
                        <div className="space-y-2">
                          {getDiscipleshipGroups(selectedMember).map((g) => (
                            <div key={g.group_name} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-secondary/5 border border-secondary/10">
                              <div className="h-8 w-8 rounded-lg bg-secondary/15 flex items-center justify-center shrink-0">
                                <BookOpen className="h-4 w-4 text-secondary" />
                              </div>
                              <span className="text-sm font-medium text-foreground">{g.group_name}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-muted/30 text-center border border-dashed border-border/50">
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
