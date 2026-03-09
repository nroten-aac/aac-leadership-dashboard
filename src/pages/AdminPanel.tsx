import { useState } from "react";
import { useInvitations, ALL_TABS } from "@/hooks/usePermissions";
import { useUserRole } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { UserPlus, Shield, Users, Mail, Check, Clock, X } from "lucide-react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

const AdminPanel = () => {
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const { invitations, allUsers, isLoading, sendInvite } = useInvitations();
  const [email, setEmail] = useState("");
  const [selectedTabs, setSelectedTabs] = useState<string[]>(ALL_TABS.map((t) => t.id));
  const [role, setRole] = useState("viewer");

  if (roleLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <DashboardSidebar />
        <main className="flex-1 ml-[72px] p-8">
          <p className="text-muted-foreground">Loading…</p>
        </main>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex">
        <DashboardSidebar />
        <main className="flex-1 ml-[72px] p-8">
          <p className="text-muted-foreground">You don't have access to this page.</p>
        </main>
      </div>
    );
  }

  const handleToggleTab = (tabId: string) => {
    setSelectedTabs((prev) =>
      prev.includes(tabId) ? prev.filter((t) => t !== tabId) : [...prev, tabId]
    );
  };

  const handleSendInvite = async () => {
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }
    try {
      await sendInvite.mutateAsync({ email, allowed_tabs: selectedTabs, role });
      toast.success(`Invitation sent to ${email}`);
      setEmail("");
      setSelectedTabs(ALL_TABS.map((t) => t.id));
      setRole("viewer");
    } catch (err: any) {
      toast.error(err.message || "Failed to send invitation");
    }
  };

  const statusIcon = (status: string) => {
    if (status === "accepted") return <Check className="h-3.5 w-3.5 text-green-500" />;
    if (status === "pending") return <Clock className="h-3.5 w-3.5 text-amber-500" />;
    return <X className="h-3.5 w-3.5 text-destructive" />;
  };

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <main className="flex-1 ml-[72px] p-8 max-w-[1400px]">
        <DashboardHeader />

        <div className="grid gap-6 lg:grid-cols-2 mt-6">
          {/* Send Invitation */}
          <Card className="border-0 shadow-card rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserPlus className="h-5 w-5 text-primary" />
                Send Invitation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email Address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="leader@church.org"
                />
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Admins can invite others and manage permissions
                </p>
              </div>

              <div className="space-y-2">
                <Label>Dashboard Access</Label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_TABS.map((tab) => (
                    <label
                      key={tab.id}
                      className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Checkbox
                        checked={selectedTabs.includes(tab.id)}
                        onCheckedChange={() => handleToggleTab(tab.id)}
                      />
                      {tab.label}
                    </label>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleSendInvite}
                disabled={sendInvite.isPending || !email}
                className="w-full"
              >
                <Mail className="h-4 w-4 mr-2" />
                {sendInvite.isPending ? "Sending…" : "Send Invitation"}
              </Button>
            </CardContent>
          </Card>

          {/* Current Users */}
          <Card className="border-0 shadow-card rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                Current Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allUsers.profiles.length === 0 ? (
                <p className="text-muted-foreground text-sm">No users yet</p>
              ) : (
                <div className="space-y-3">
                  {allUsers.profiles.map((profile) => {
                    const userRoles = allUsers.roles.filter((r) => r.user_id === profile.user_id);
                    const userPerms = allUsers.permissions.filter((p) => p.user_id === profile.user_id);
                    const isUserAdmin = userRoles.some((r) => r.role === "admin");

                    return (
                      <div key={profile.id} className="p-3 rounded-xl bg-muted/50 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-foreground">
                              {profile.display_name || "Unnamed"}
                            </span>
                            {isUserAdmin && (
                              <Badge variant="outline" className="text-xs gap-1">
                                <Shield className="h-3 w-3" />
                                Admin
                              </Badge>
                            )}
                          </div>
                        </div>
                        {userPerms.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {userPerms.map((p) => (
                              <Badge key={p.id} variant="secondary" className="text-xs">
                                {ALL_TABS.find((t) => t.id === p.tab_name)?.label || p.tab_name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Invitation History */}
        <Card className="border-0 shadow-card rounded-2xl mt-6">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5 text-primary" />
              Invitation History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invitations.length === 0 ? (
              <p className="text-muted-foreground text-sm">No invitations sent yet</p>
            ) : (
              <div className="space-y-2">
                {invitations.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                    <div className="flex items-center gap-3">
                      {statusIcon(inv.status)}
                      <div>
                        <p className="text-sm font-medium text-foreground">{inv.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(inv.created_at).toLocaleDateString()}
                          {inv.allowed_tabs?.length > 0 && ` · ${inv.allowed_tabs.length} tabs`}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={inv.status === "accepted" ? "default" : "outline"}
                      className="text-xs capitalize"
                    >
                      {inv.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminPanel;
