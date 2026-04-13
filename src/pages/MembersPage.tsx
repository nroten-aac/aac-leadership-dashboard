import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Users, Search, RefreshCw, BookOpen, Heart, Mail, Phone,
  MapPin, Calendar, User, ChevronRight, X
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
  const [selectedMember, setSelectedMember] = useState<MemberWithGroups | null>(null);

  const { data: members = [], isLoading, refetch } = useQuery({
    queryKey: ["members-with-groups"],
    queryFn: async () => {
      const { data: membersData, error } = await supabase
        .from("members")
        .select("*")
        .order("last_name", { ascending: true });
      if (error) throw error;

      const { data: groupsData } = await supabase
        .from("member_groups")
        .select("*");

      const groupsByMember = new Map<string, MemberGroup[]>();
      for (const g of groupsData || []) {
        const existing = groupsByMember.get(g.member_id) || [];
        existing.push({ group_name: g.group_name, group_type: g.group_type });
        groupsByMember.set(g.member_id, existing);
      }

      return (membersData || []).map((m) => ({
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
        (m.email || "").toLowerCase().includes(search.toLowerCase());

      // Category filter based on membership lists
      if (categoryFilter !== "all") {
        const requiredLists = MEMBERSHIP_LIST_MAP[categoryFilter] || [];
        const membershipGroups = m.groups
          .filter((g) => g.group_type === "membership")
          .map((g) => g.group_name);
        const inCategory = requiredLists.some((l) => membershipGroups.includes(l));
        if (!inCategory) return false;
      }

      return matchesSearch;
    });
  }, [members, search, categoryFilter]);

  const stats = useMemo(() => {
    const memberAdults = members.filter((m) =>
      m.groups.some((g) => g.group_name === "Member Adults")
    ).length;
    const memberChildren = members.filter((m) =>
      m.groups.some((g) => g.group_name === "Member Children")
    ).length;
    const regularAdults = members.filter((m) =>
      m.groups.some((g) => g.group_name === "Regular Attender Adults")
    ).length;
    const regularChildren = members.filter((m) =>
      m.groups.some((g) => g.group_name === "Regular Attender Children")
    ).length;
    const volunteering = members.filter((m) =>
      m.groups.some((g) => g.group_type === "volunteer")
    ).length;
    const inDiscipleship = members.filter((m) =>
      m.groups.some((g) => g.group_type === "discipleship")
    ).length;
    return { memberAdults, memberChildren, regularAdults, regularChildren, volunteering, inDiscipleship, total: members.length };
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
    if (cats.includes("Member Children")) return "Member Child";
    if (cats.includes("Regular Attender Adults")) return "Regular Attender";
    if (cats.includes("Regular Attender Children")) return "Regular Child";
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
    if (score >= 4) return { label: "Well Connected", color: "bg-emerald-500" };
    if (score >= 3) return { label: "Connected", color: "bg-emerald-400" };
    if (score >= 2) return { label: "Partially Connected", color: "bg-amber-400" };
    return { label: "Needs Connection", color: "bg-red-400" };
  };

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <main className="flex-1 ml-[72px] p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Church Family</h1>
            <p className="text-sm text-muted-foreground">
              Understanding how people connect to the life of the church
            </p>
          </div>
          <Button onClick={handleSync} disabled={importing} variant="outline" className="gap-2">
            <RefreshCw className={`h-4 w-4 ${importing ? "animate-spin" : ""}`} />
            {importing ? "Syncing..." : "Sync from PCO"}
          </Button>
        </div>

        {/* Stats ribbon */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { label: "Member Adults", value: stats.memberAdults, icon: Users, accent: "bg-primary/10 text-primary" },
            { label: "Member Children", value: stats.memberChildren, icon: User, accent: "bg-amber-500/10 text-amber-600" },
            { label: "Regular Adults", value: stats.regularAdults, icon: Users, accent: "bg-blue-500/10 text-blue-600" },
            { label: "Regular Children", value: stats.regularChildren, icon: User, accent: "bg-sky-500/10 text-sky-600" },
            { label: "Volunteering", value: stats.volunteering, icon: Heart, accent: "bg-emerald-500/10 text-emerald-600" },
            { label: "In Groups", value: stats.inDiscipleship, icon: BookOpen, accent: "bg-violet-500/10 text-violet-600" },
          ].map((s) => (
            <Card key={s.label} className="border-none shadow-sm">
              <CardContent className="p-3 flex items-center gap-2.5">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${s.accent}`}>
                  <s.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold text-foreground leading-tight">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_FILTERS.map((f) => (
                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {filtered.length} people
          </span>
        </div>

        {/* Members grid */}
        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">Loading members...</div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">
                {members.length === 0
                  ? 'No members yet. Click "Sync from PCO" to import your church family.'
                  : "No people match your current filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((member) => {
              const volunteers = getVolunteerGroups(member);
              const discipleship = getDiscipleshipGroups(member);
              const category = getMembershipCategory(member);
              const connScore = getConnectionScore(member);
              const conn = getConnectionLabel(connScore);

              return (
                <Card
                  key={member.id}
                  className="group cursor-pointer hover:shadow-md transition-all duration-200 border-border/50"
                  onClick={() => setSelectedMember(member)}
                >
                  <CardContent className="p-4">
                    {/* Top row: avatar + name + category */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-semibold text-primary">
                          {getInitials(member.first_name, member.last_name)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground truncate text-sm">
                            {member.first_name} {member.last_name}
                          </h3>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                            {category}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <div className={`h-1.5 w-1.5 rounded-full ${conn.color}`} />
                            <span className="text-[10px] text-muted-foreground">{conn.label}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contact row */}
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-3">
                      {member.email && (
                        <span className="flex items-center gap-1 truncate">
                          <Mail className="h-3 w-3 shrink-0" />{member.email}
                        </span>
                      )}
                      {member.phone && (
                        <span className="flex items-center gap-1 shrink-0">
                          <Phone className="h-3 w-3" />{member.phone}
                        </span>
                      )}
                    </div>

                    {/* Groups */}
                    <div className="flex flex-wrap gap-1">
                      {volunteers.map((g) => (
                        <Badge
                          key={`v-${g.group_name}`}
                          variant="secondary"
                          className="text-[10px] py-0 bg-emerald-500/10 text-emerald-700 border-0 gap-0.5"
                        >
                          <Heart className="h-2.5 w-2.5" />
                          {g.group_name}
                        </Badge>
                      ))}
                      {discipleship.map((g) => (
                        <Badge
                          key={`d-${g.group_name}`}
                          variant="secondary"
                          className="text-[10px] py-0 bg-violet-500/10 text-violet-700 border-0 gap-0.5"
                        >
                          <BookOpen className="h-2.5 w-2.5" />
                          {g.group_name}
                        </Badge>
                      ))}
                      {volunteers.length === 0 && discipleship.length === 0 && (
                        <span className="text-[10px] text-muted-foreground/50 italic">
                          Not yet in a group or team
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Detail dialog */}
        <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
          {selectedMember && (
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-base font-bold text-primary">
                      {getInitials(selectedMember.first_name, selectedMember.last_name)}
                    </span>
                  </div>
                  <div>
                    <div className="text-lg">{selectedMember.first_name} {selectedMember.last_name}</div>
                    <Badge variant="outline" className="text-xs font-normal mt-0.5">
                      {getMembershipCategory(selectedMember)}
                    </Badge>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5 mt-2">
                {/* Connection status */}
                {(() => {
                  const conn = getConnectionLabel(getConnectionScore(selectedMember));
                  return (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <div className={`h-2.5 w-2.5 rounded-full ${conn.color}`} />
                      <span className="text-sm font-medium">{conn.label}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {getConnectionScore(selectedMember)}/4 connection points
                      </span>
                    </div>
                  );
                })()}

                {/* Contact info */}
                <div>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Contact Information</h4>
                  <div className="space-y-2">
                    {selectedMember.email && (
                      <a href={`mailto:${selectedMember.email}`} className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {selectedMember.email}
                      </a>
                    )}
                    {selectedMember.phone && (
                      <a href={`tel:${selectedMember.phone}`} className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {selectedMember.phone}
                      </a>
                    )}
                    {selectedMember.address && (
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {selectedMember.address}
                      </div>
                    )}
                    {selectedMember.date_of_birth && (
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(selectedMember.date_of_birth).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      </div>
                    )}
                    {!selectedMember.email && !selectedMember.phone && (
                      <p className="text-sm text-muted-foreground italic">No contact info on file</p>
                    )}
                  </div>
                </div>

                {/* Volunteering */}
                <div>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                    Volunteering
                  </h4>
                  {getVolunteerGroups(selectedMember).length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {getVolunteerGroups(selectedMember).map((g) => (
                        <Badge
                          key={g.group_name}
                          className="bg-emerald-500/10 text-emerald-700 border-0 gap-1"
                        >
                          <Heart className="h-3 w-3" />
                          {g.group_name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Not currently serving on a team — opportunity to invite!
                    </p>
                  )}
                </div>

                {/* Discipleship groups */}
                <div>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                    Discipleship Groups
                  </h4>
                  {getDiscipleshipGroups(selectedMember).length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {getDiscipleshipGroups(selectedMember).map((g) => (
                        <Badge
                          key={g.group_name}
                          className="bg-violet-500/10 text-violet-700 border-0 gap-1"
                        >
                          <BookOpen className="h-3 w-3" />
                          {g.group_name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Not in a discipleship group — great candidate to connect!
                    </p>
                  )}
                </div>
              </div>
            </DialogContent>
          )}
        </Dialog>
      </main>
    </div>
  );
};

export default MembersPage;
