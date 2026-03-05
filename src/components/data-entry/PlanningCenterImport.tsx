import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Cloud, Loader2, CheckCircle, AlertCircle } from "lucide-react";

const PlanningCenterImport = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ message: string; imported?: number; errors?: string[] } | null>(null);

  const handleImport = async () => {
    setImporting(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("import-planning-center-people");

      if (error) {
        toast({ title: "Import failed", description: error.message, variant: "destructive" });
        setResult({ message: error.message });
      } else {
        setResult(data);
        toast({ title: "Import complete", description: data.message });
        queryClient.invalidateQueries({ queryKey: ["members"] });
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
        <Cloud className="h-4 w-4" /> Planning Center Import
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        Import all people from your Planning Center account into the members database. This will add new records (existing members are not duplicated by name but may create duplicates if run multiple times).
      </p>

      <Button onClick={handleImport} disabled={importing} className="gap-2">
        {importing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Importing...
          </>
        ) : (
          <>
            <Cloud className="h-4 w-4" /> Import from Planning Center
          </>
        )}
      </Button>

      {result && (
        <div className={`mt-4 p-3 rounded-xl text-sm flex items-start gap-2 ${result.errors ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
          {result.errors ? <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> : <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />}
          <div>
            <p>{result.message}</p>
            {result.errors?.map((e, i) => (
              <p key={i} className="text-xs mt-1">{e}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanningCenterImport;
