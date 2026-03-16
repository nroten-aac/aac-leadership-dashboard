import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import GivingEntry from "@/components/data-entry/GivingEntry";
import AttendanceEntry from "@/components/data-entry/AttendanceEntry";
import MembersEntry from "@/components/data-entry/MembersEntry";
import BuildingEntry from "@/components/data-entry/BuildingEntry";
import PlanningCenterImport from "@/components/data-entry/PlanningCenterImport";
import DataDownload from "@/components/data-entry/DataDownload";

const DataEntry = () => {
  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <main className="flex-1 ml-[72px] p-8 max-w-[1400px]">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-foreground">Data Entry</h1>
          <p className="text-sm text-muted-foreground mt-1">Add and manage church data</p>
        </div>

        <Tabs defaultValue="giving" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="giving">Giving</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="building">Building</TabsTrigger>
          </TabsList>

          <TabsContent value="giving">
            <GivingEntry />
          </TabsContent>
          <TabsContent value="attendance">
            <AttendanceEntry />
          </TabsContent>
          <TabsContent value="members">
            <MembersEntry />
            <div className="mt-6">
              <PlanningCenterImport />
            </div>
          </TabsContent>
          <TabsContent value="building">
            <BuildingEntry />
          </TabsContent>
        </Tabs>

        <div className="mt-6">
          <DataDownload />
        </div>
      </main>
    </div>
  );
};

export default DataEntry;
