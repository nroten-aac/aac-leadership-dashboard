import { Routes, Route } from "react-router-dom";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import RoadmapHeader from "@/roadmap/components/RoadmapHeader";
import TodayTab from "@/roadmap/tabs/TodayTab";
import DashboardTab from "@/roadmap/tabs/DashboardTab";
import PlaybookTab from "@/roadmap/tabs/PlaybookTab";
import ActionPlanTab from "@/roadmap/tabs/ActionPlanTab";
import PeopleTab from "@/roadmap/tabs/PeopleTab";

export default function RoadmapShell() {
  return (
    <div className="roadmap-dark min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-[72px]">
        <RoadmapHeader />
        <main>
          <Routes>
            <Route index element={<TodayTab />} />
            <Route path="dashboard" element={<DashboardTab />} />
            <Route path="playbook" element={<PlaybookTab />} />
            <Route path="actions" element={<ActionPlanTab />} />
            <Route path="people" element={<PeopleTab />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
