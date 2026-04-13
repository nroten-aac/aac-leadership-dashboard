import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Users, Search, RefreshCw, BookOpen, Heart } from "lucide-react";
import { toast } from "sonner";

const MembersPage = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [importing, setImporting] = useState(false);

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

      const groupsByMember = new Map<string, { group_name: string; group_type: string }[]>();
      for (const g of groupsData || []) {
        const existing = groupsByMember.get(g.member_id) || [];
        existing.push({ group_name: g.group_name, group_type: g.group_type });
        groupsByMember.set(g.member_id, existing);
      }

      return (membersData || []).map((m) => ({
        ...m,
        groups: groupsByMember.get(m.id) || [],
      }));
    },
  });

  const allGroups = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => m.groups.forEach((g: any) => set.add(`${g.group_type}:${g.group_name}`)));
    return Array.from(set).sort();
  }, [members]);

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const matchesSearch =
        !search ||
        `${m.first_name} ${m.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
        (m.email || "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || m.membership_status === statusFilter;
      const matchesGroup =
        groupFilter === "all" ||
        m.groups.some((g: any) => `${g.group_type}:${g.group_name}` === groupFilter);
      return matchesSearch && matchesStatus && matchesGroup;
    });
  }, [members, search, statusFilter, groupFilter]);

  const handleSync = async () => {
    setImporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

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

  const isChild = (dob: string | null) => {
    if (!dob) return false;
    const age = (Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    return age < 18;
  };

  const stats = useMemo(() => {
    const adults = members.filter((m) => !isChild(m.date_of_birth)).length;
    const children = members.filter((m) => isChild(m.date_of_birth)).length;
    const withGroups = members.filter((m) => m.groups.length > 0).length;
    return { total: members.length, adults, children, withGroups };
  }, [members]);

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <main className="flex-1 ml-[72px] p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Church Family</h1>
            <p className="text-muted-foreground text-sm">
              Members synced from Planning Center
            </p>
          </div>
          <Button onClick={handleSync} disabled={importing} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${importing ? "animate-spin" : ""}`} />
            {importing ? "Syncing..." : "Sync from PCO"}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total People</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.adults}</p>
                <p className="text-xs text-muted-foreground">Adults</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.children}</p>
                <p className="text-xs text-muted-foreground">Children</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.withGroups}</p>
                <p className="text-xs text-muted-foreground">In Groups</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="visitor">Visitor</SelectItem>
            </SelectContent>
          </Select>
          <Select value={groupFilter} onValueChange={setGroupFilter}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {allGroups.map((g) => {
                const [type, ...nameParts] = g.split(":");
                const name = nameParts.join(":");
                return (
                  <SelectItem key={g} value={g}>
                    {type === "volunteer" ? "🤝 " : "📖 "}{name}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Members list */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading members...</div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">
                {members.length === 0
                  ? 'No members yet. Click "Sync from PCO" to import.'
                  : "No members match your filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            <div className="text-sm text-muted-foreground">{filtered.length} people</div>
            {filtered.map((member) => {
              const volunteerGroups = member.groups.filter((g: any) => g.group_type === "volunteer");
              const discipleshipGroups = member.groups.filter((g: any) => g.group_type === "discipleship");
              const child = isChild(member.date_of_birth);

              return (
                <Card key={member.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Avatar + Name */}
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-semibold text-primary">
                          {member.first_name[0]}{member.last_name[0]}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-foreground flex items-center gap-2">
                          {member.first_name} {member.last_name}
                          {child && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-600 border-amber-300">
                              Child
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{member.email || "No email"}</p>
                      </div>
                    </div>

                    {/* Groups */}
                    <div className="flex-1 flex flex-wrap gap-1.5">
                      {volunteerGroups.map((g: any) => (
                        <Badge
                          key={g.group_name}
                          variant="secondary"
                          className="text-[11px] bg-emerald-500/10 text-emerald-700 border-emerald-200 gap-1"
                        >
                          <Heart className="h-3 w-3" />
                          {g.group_name}
                        </Badge>
                      ))}
                      {discipleshipGroups.map((g: any) => (
                        <Badge
                          key={g.group_name}
                          variant="secondary"
                          className="text-[11px] bg-blue-500/10 text-blue-700 border-blue-200 gap-1"
                        >
                          <BookOpen className="h-3 w-3" />
                          {g.group_name}
                        </Badge>
                      ))}
                    </div>

                    {/* Status */}
                    <Badge
                      variant="outline"
                      className={`text-[11px] shrink-0 ${
                        member.membership_status === "active"
                          ? "text-emerald-600 border-emerald-300"
                          : member.membership_status === "visitor"
                          ? "text-blue-600 border-blue-300"
                          : "text-muted-foreground"
                      }`}
                    >
                      {member.membership_status}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default MembersPage;
