import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import { toast } from "sonner";

type DataSet = "attendance" | "monthly_giving" | "members" | "donations" | "discipleship_programs" | "program_enrollments";

const DATA_SETS: { id: DataSet; label: string }[] = [
  { id: "attendance", label: "Attendance" },
  { id: "monthly_giving", label: "Monthly Giving" },
  { id: "members", label: "Members" },
  { id: "donations", label: "Donations" },
  { id: "discipleship_programs", label: "Discipleship Programs" },
  { id: "program_enrollments", label: "Program Enrollments" },
];

function toCsv(data: Record<string, any>[]): string {
  if (data.length === 0) return "";
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h];
      if (val === null || val === undefined) return "";
      const str = String(val);
      return str.includes(",") || str.includes('"') || str.includes("\n")
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    }).join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

function downloadFile(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const DataDownload = () => {
  const [downloading, setDownloading] = useState<DataSet | null>(null);

  const handleDownload = async (dataSet: DataSet) => {
    setDownloading(dataSet);
    try {
      const { data, error } = await supabase.from(dataSet).select("*");
      if (error) throw error;
      if (!data || data.length === 0) {
        toast.info("No data to download");
        return;
      }
      const csv = toCsv(data);
      const date = new Date().toISOString().slice(0, 10);
      downloadFile(csv, `${dataSet}_${date}.csv`);
      toast.success(`Downloaded ${data.length} ${dataSet.replace(/_/g, " ")} records`);
    } catch (err: any) {
      toast.error(err.message || "Download failed");
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadAll = async () => {
    setDownloading("attendance" as DataSet);
    try {
      for (const ds of DATA_SETS) {
        const { data, error } = await supabase.from(ds.id).select("*");
        if (error) throw error;
        if (data && data.length > 0) {
          const csv = toCsv(data);
          const date = new Date().toISOString().slice(0, 10);
          downloadFile(csv, `${ds.id}_${date}.csv`);
        }
      }
      toast.success("All data downloaded");
    } catch (err: any) {
      toast.error(err.message || "Download failed");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <Card className="border-0 shadow-card rounded-2xl">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Download className="h-5 w-5 text-primary" />
          Download Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DATA_SETS.map((ds) => (
            <Button
              key={ds.id}
              variant="outline"
              size="sm"
              className="justify-start gap-2"
              disabled={downloading !== null}
              onClick={() => handleDownload(ds.id)}
            >
              <Download className="h-3.5 w-3.5" />
              {ds.label}
            </Button>
          ))}
        </div>
        <Button
          onClick={handleDownloadAll}
          disabled={downloading !== null}
          className="w-full mt-2 gap-2"
        >
          <Download className="h-4 w-4" />
          {downloading ? "Downloading…" : "Download All as CSV"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default DataDownload;
