import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatsCards from "@/components/dashboard/StatsCards";
import AttendanceChart from "@/components/dashboard/AttendanceChart";
import AttendanceBreakdown from "@/components/dashboard/AttendanceBreakdown";
import DonationsChart from "@/components/dashboard/DonationsChart";
import DiscipleshipOverview from "@/components/dashboard/DiscipleshipOverview";
import MembershipBreakdown from "@/components/dashboard/MembershipBreakdown";
import RecentActivity from "@/components/dashboard/RecentActivity";
import AIChatPanel from "@/components/dashboard/AIChatPanel";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const { members, attendance, donations, programs, enrollments, isLoading } = useDashboardData();

  const totalDonations = donations.reduce((s, d) => s + d.amount, 0);
  const activeMembers = members.filter((m) => m.membership_status === "active").length;

  // Average adjusted_total per service record
  const avgAttendance = attendance.length > 0
    ? Math.round(attendance.reduce((s, a) => s + a.adjusted_total, 0) / attendance.length)
    : 0;

  const activeEnrollments = enrollments.filter((e) => e.status === "active").length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="gradient-primary px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <Skeleton className="h-10 w-60 bg-primary-foreground/20" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <StatsCards
          totalMembers={members.length}
          activeMembers={activeMembers}
          totalDonations={totalDonations}
          avgAttendance={avgAttendance}
          totalEnrollments={activeEnrollments}
        />

        {/* Full-width attendance chart */}
        <AttendanceChart attendance={attendance} />

        {/* Donations chart */}
        <DonationsChart donations={donations} />

        {/* Row 2: Donut pie + Horizontal bar + Donut breakdown */}
        <div className="grid gap-6 lg:grid-cols-3">
          <AttendanceBreakdown attendance={attendance} />
          <DiscipleshipOverview enrollments={enrollments as any} />
          <MembershipBreakdown members={members} />
        </div>

        {/* Row 3: Recent activity full width */}
        <RecentActivity donations={donations as any} attendance={attendance as any} />
      </main>
      <AIChatPanel />
    </div>
  );
};

export default Dashboard;
