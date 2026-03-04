import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
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
  const { members, attendance, donations, programs, enrollments, monthlyGiving, isLoading } = useDashboardData();

  const totalDonations = donations.reduce((s, d) => s + d.amount, 0);
  const activeMembers = members.filter((m) => m.membership_status === "active").length;

  const activeEnrollments = enrollments.filter((e) => e.status === "active").length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <div className="w-[72px] bg-card shrink-0" />
        <div className="flex-1 p-8">
          <Skeleton className="h-12 w-72 rounded-2xl mb-8" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-2xl mb-6" />
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-72 rounded-2xl" />
            <Skeleton className="h-72 rounded-2xl" />
            <Skeleton className="h-72 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <main className="flex-1 ml-[72px] p-8 max-w-[1400px]">
        <DashboardHeader />

        <StatsCards
          attendance={attendance}
          totalDonations={totalDonations}
          totalEnrollments={activeEnrollments}
        />

        {/* Full-width attendance chart */}
        <div className="mt-6">
          <AttendanceChart attendance={attendance} />
        </div>

        {/* Full-width giving chart */}
        <div className="mt-6">
          <DonationsChart monthlyGiving={monthlyGiving} />
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-1 mt-6">
          <RecentActivity donations={donations as any} attendance={attendance as any} />
        </div>

        {/* Bottom row: 3 cards */}
        <div className="grid gap-6 lg:grid-cols-3 mt-6">
          <AttendanceBreakdown attendance={attendance} />
          <DiscipleshipOverview enrollments={enrollments as any} />
          <MembershipBreakdown members={members} />
        </div>
      </main>
      <AIChatPanel />
    </div>
  );
};

export default Dashboard;
