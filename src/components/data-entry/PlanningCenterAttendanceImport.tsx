import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Cloud, Loader2, CheckCircle, AlertCircle } from "lucide-react";

const PlanningCenterAttendanceImport = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [importing, setImporting] = useState(false);
  const [weeks, setWeeks] = useState("6");
  const [result, setResult] = useState<{ message: string; rows?: number; dates?: number; details?: any[]; errors?: string[] } | null>(null);

  const handleImport = async () => {
    setImporting(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("import-pco-attendance", {
        body: { weeks: parseInt(weeks) || 6 },
      });
      if (error) {
        toast({ title: "Sync failed", description: error.message, variant: "destructive" });
        setResult({ message: error.message });
      } else {
        setResult(data);
        toast({ title: "Sync complete", description: data.message });
        queryClient.invalidateQueries({ queryKey: ["attendance"] });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setResult({ message: err.message });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl shadow-card p-6">
      <h3 className="font-display font-semibold text-foreground mb-2 flex items-center gap-2">
        <Cloud className="h-4 w-4" /> Planning Center Attendance Sync
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        Pulls Sanctuary headcounts (9:15 + 11:00) and Children's Ministry check-ins (Nursery, K-3, 4-6, Youth, Volunteers) from Planning Center. Existing rows for matched dates/services are replaced.
      </p>

      <div className="flex items-end gap-3 mb-4">
        <div>
          <Label htmlFor="weeks" className="text-xs">Weeks to sync</Label>
          <Input
            id="weeks"
            type="number"
            min={1}
            max={26}
            value={weeks}
            onChange={(e) => setWeeks(e.target.value)}
            className="w-24"
          />
        </div>
        <Button onClick={handleImport} disabled={importing} className="gap-2">
          {importing ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Syncing...</>
          ) : (
            <><Cloud className="h-4 w-4" /> Sync from Planning Center</>
          )}
        </Button>
      </div>

      {result && (
        <div className={`p-3 rounded-xl text-sm ${result.errors ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
          <div className="flex items-start gap-2">
            {result.errors ? <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> : <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />}
            <div className="flex-1">
              <p className="font-medium">{result.message}</p>
              {result.details && result.details.length > 0 && (
                <div className="mt-3 overflow-x-auto">
                  <table className="text-xs w-full text-foreground">
                    <thead>
                      <tr className="text-left border-b border-border">
                        <th className="py-1 pr-3">Date</th>
                        <th className="py-1 pr-3">9:15</th>
                        <th className="py-1 pr-3">11:00</th>
                        <th className="py-1 pr-3">Nursery</th>
                        <th className="py-1 pr-3">K-3</th>
                        <th className="py-1 pr-3">4-6</th>
                        <th className="py-1 pr-3">Youth</th>
                        <th className="py-1 pr-3">Vol</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.details.map((d, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="py-1 pr-3 font-medium">{d.date}</td>
                          <td className="py-1 pr-3">{d["9:15"]}</td>
                          <td className="py-1 pr-3">{d["11:00"]}</td>
                          <td className="py-1 pr-3">{d.nursery}</td>
                          <td className="py-1 pr-3">{d.k3}</td>
                          <td className="py-1 pr-3">{d["4-6"]}</td>
                          <td className="py-1 pr-3">{d.youth}</td>
                          <td className="py-1 pr-3">{d.volunteers}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {result.errors?.map((e, i) => (
                <p key={i} className="text-xs mt-1">{e}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanningCenterAttendanceImport;
