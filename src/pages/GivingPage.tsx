import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DonationsChart from "@/components/dashboard/DonationsChart";
import GivingPieCharts from "@/components/dashboard/GivingPieCharts";
import AIChatPanel from "@/components/dashboard/AIChatPanel";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";

const GivingPage = () => {
  const { monthlyGiving, isLoading } = useDashboardData();

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <main className="flex-1 ml-[72px] p-8 max-w-[1400px]">
        <DashboardHeader />

        {isLoading ? (
          <>
            <Skeleton className="h-[460px] rounded-2xl mt-6" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <Skeleton className="h-[300px] rounded-2xl" />
              <Skeleton className="h-[300px] rounded-2xl" />
            </div>
          </>
        ) : (
          <>
            <div className="mt-6">
              <DonationsChart monthlyGiving={monthlyGiving} />
            </div>
            <GivingPieCharts monthlyGiving={monthlyGiving} />
          </>
        )}
        )}
      </main>
      <AIChatPanel />
    </div>
  );
};

export default GivingPage;
