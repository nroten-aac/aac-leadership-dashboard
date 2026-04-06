import { useState, useEffect } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Upload, AlertTriangle, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import RecentEntries from "./RecentEntries";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const SERVICES = ["1st Sunday Service (9:15)", "2nd Sunday Service (11:00)", "Wednesday", "Not Applicable"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const QUARTERS = ["Q1","Q2","Q3","Q4"];

function getQuarter(month: number) {
  return `Q${Math.ceil((month + 1) / 3)}`;
}

const AttendanceEntry = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);
  const [eventDate, setEventDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [service, setService] = useState("");
  const [sanctuary, setSanctuary] = useState("");
  const [online, setOnline] = useState("0");
  const [nursery, setNursery] = useState("0");
  const [k3, setK3] = useState("0");
  const [grade46, setGrade46] = useState("0");
  const [youth, setYouth] = useState("0");
  const [volunteers, setVolunteers] = useState("0");
  const [notes, setNotes] = useState("");

  // Fetch existing entries for the selected date
  const { data: existingEntries } = useQuery({
    queryKey: ["attendance", "existing", eventDate],
    queryFn: async () => {
      if (!eventDate) return [];
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("event_date", eventDate)
        .order("service", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!eventDate,
  });

  const matchingEntries = existingEntries?.filter(e => e.service === service) || [];
  const hasExactMatch = matchingEntries.length > 0;

  const doSave = async () => {
    const d = new Date(eventDate);
    const monthName = MONTHS[d.getMonth()];
    const year = d.getFullYear();
    const quarter = getQuarter(d.getMonth());

    const sanctuaryNum = parseInt(sanctuary) || 0;
    const onlineNum = parseInt(online) || 0;
    const nurseryNum = parseInt(nursery) || 0;
    const k3Num = parseInt(k3) || 0;
    const grade46Num = parseInt(grade46) || 0;
    const youthNum = parseInt(youth) || 0;
    const volunteersNum = parseInt(volunteers) || 0;
    const totalK6 = nurseryNum + k3Num + grade46Num;
    const totalAdults = sanctuaryNum - volunteersNum;
    const inPersonTotal = sanctuaryNum + totalK6 + youthNum;
    const adjustedTotal = inPersonTotal + onlineNum;

    setSaving(true);
    let error;
    if (editingEntry) {
      const res = await supabase.from("attendance").update({
        event_date: eventDate,
        service,
        month: monthName,
        year,
        quarter,
        sanctuary_attendance: sanctuaryNum,
        online_attendance: onlineNum,
        nursery_attendance: nurseryNum,
        k3_attendance: k3Num,
        grade_4_6_attendance: grade46Num,
        youth_attendance: youthNum,
        volunteer_classroom_attendance: volunteersNum,
        total_k6_attendance: totalK6,
        total_adults: totalAdults,
        in_person_total: inPersonTotal,
        adjusted_total: adjustedTotal,
        notes: notes || null,
      }).eq("id", editingEntry.id);
      error = res.error;
    } else {
      const res = await supabase.from("attendance").insert({
        event_date: eventDate,
        service,
        month: monthName,
        year,
        quarter,
        sanctuary_attendance: sanctuaryNum,
        online_attendance: onlineNum,
        nursery_attendance: nurseryNum,
        k3_attendance: k3Num,
        grade_4_6_attendance: grade46Num,
        youth_attendance: youthNum,
        volunteer_classroom_attendance: volunteersNum,
        total_k6_attendance: totalK6,
        total_adults: totalAdults,
        in_person_total: inPersonTotal,
        adjusted_total: adjustedTotal,
        notes: notes || null,
      });
      error = res.error;
    }
    setSaving(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editingEntry ? "Updated" : "Saved", description: `Attendance for ${monthName} ${d.getDate()}, ${year} ${editingEntry ? "updated" : "saved"}.` });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      setSanctuary(""); setOnline("0"); setNursery("0"); setK3("0"); setGrade46("0"); setYouth("0"); setVolunteers("0"); setNotes("");
      setEditingEntry(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventDate || !service) {
      toast({ title: "Missing fields", description: "Date and service are required.", variant: "destructive" });
      return;
    }
    if (service !== "Not Applicable" && !sanctuary) {
      toast({ title: "Missing fields", description: "Sanctuary attendance is required for this service.", variant: "destructive" });
      return;
    }

    if (hasExactMatch && !editingEntry) {
      setShowDuplicateWarning(true);
      return;
    }

    await doSave();
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split("\n").filter(l => l.trim());
    const rows = lines.slice(1).map(line => {
      const c = line.split(",").map(s => s.trim().replace(/^"|"$/g, ""));
      const d = new Date(c[0]);
      const monthName = MONTHS[d.getMonth()];
      const year = d.getFullYear();
      const quarter = getQuarter(d.getMonth());
      const sanctuaryNum = parseInt(c[2]) || 0;
      const onlineNum = parseInt(c[3]) || 0;
      const nurseryNum = parseInt(c[4]) || 0;
      const k3Num = parseInt(c[5]) || 0;
      const grade46Num = parseInt(c[6]) || 0;
      const youthNum = parseInt(c[7]) || 0;
      const volunteersNum = parseInt(c[8]) || 0;
      const totalK6 = nurseryNum + k3Num + grade46Num;
      return {
        event_date: c[0], service: c[1], month: monthName, year, quarter,
        sanctuary_attendance: sanctuaryNum, online_attendance: onlineNum,
        nursery_attendance: nurseryNum, k3_attendance: k3Num, grade_4_6_attendance: grade46Num,
        youth_attendance: youthNum, volunteer_classroom_attendance: volunteersNum,
        total_k6_attendance: totalK6, total_adults: sanctuaryNum - volunteersNum,
        in_person_total: sanctuaryNum + totalK6 + youthNum,
        adjusted_total: sanctuaryNum + totalK6 + youthNum + onlineNum,
        notes: c[9] || null,
      };
    }).filter(r => r.event_date && r.service && r.year);

    if (!rows.length) {
      toast({ title: "No valid rows", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("attendance").insert(rows);
    if (error) toast({ title: "Import error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Imported", description: `${rows.length} attendance records imported.` });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    }
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-2xl shadow-card p-6">
        <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Manual Entry
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Service</Label>
              <Select value={service} onValueChange={setService}>
                <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                <SelectContent>
                  {SERVICES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Sanctuary</Label>
              <Input type="number" value={sanctuary} onChange={e => setSanctuary(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>Online</Label>
              <Input type="number" value={online} onChange={e => setOnline(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Nursery</Label>
              <Input type="number" value={nursery} onChange={e => setNursery(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>K–3</Label>
              <Input type="number" value={k3} onChange={e => setK3(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Grades 4–6</Label>
              <Input type="number" value={grade46} onChange={e => setGrade46(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Youth</Label>
              <Input type="number" value={youth} onChange={e => setYouth(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Kid's Volunteers</Label>
              <Input type="number" value={volunteers} onChange={e => setVolunteers(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : editingEntry ? "Update Attendance" : "Save Attendance"}</Button>
            {editingEntry && (
              <Button type="button" variant="outline" onClick={() => {
                setEditingEntry(null);
                setSanctuary(""); setOnline("0"); setNursery("0"); setK3("0"); setGrade46("0"); setYouth("0"); setVolunteers("0"); setNotes("");
                setService("");
              }}>Cancel Edit</Button>
            )}
          </div>
        </form>
      </div>

      {/* Existing entries for selected date */}
      {existingEntries && existingEntries.length > 0 && (
        <div className="bg-accent/50 border border-accent rounded-2xl p-4">
          <h4 className="font-display font-medium text-foreground mb-3 flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Existing entries for {new Date(eventDate + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </h4>
          <div className="overflow-x-auto">
             <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="pb-2 pr-4">Service</th>
                  <th className="pb-2 pr-4">Sanctuary</th>
                  <th className="pb-2 pr-4">Online</th>
                  <th className="pb-2 pr-4">Nursery</th>
                  <th className="pb-2 pr-4">K-3</th>
                  <th className="pb-2 pr-4">4-6</th>
                  <th className="pb-2 pr-4">Youth</th>
                  <th className="pb-2 pr-4">Vol.</th>
                  <th className="pb-2 pr-4">Total</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {existingEntries.map((entry) => (
                  <tr key={entry.id} className={`border-b border-border/50 ${service && entry.service === service ? "bg-amber-500/10 font-medium" : ""}`}>
                    <td className="py-2 pr-4">{entry.service}</td>
                    <td className="py-2 pr-4">{entry.sanctuary_attendance}</td>
                    <td className="py-2 pr-4">{entry.online_attendance}</td>
                    <td className="py-2 pr-4">{entry.nursery_attendance}</td>
                    <td className="py-2 pr-4">{entry.k3_attendance}</td>
                    <td className="py-2 pr-4">{entry.grade_4_6_attendance}</td>
                    <td className="py-2 pr-4">{entry.youth_attendance}</td>
                    <td className="py-2 pr-4">{entry.volunteer_classroom_attendance}</td>
                    <td className="py-2 pr-4">{entry.adjusted_total}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            setService(entry.service);
                            setSanctuary(String(entry.sanctuary_attendance));
                            setOnline(String(entry.online_attendance));
                            setNursery(String(entry.nursery_attendance));
                            setK3(String(entry.k3_attendance));
                            setGrade46(String(entry.grade_4_6_attendance));
                            setYouth(String(entry.youth_attendance));
                            setVolunteers(String(entry.volunteer_classroom_attendance));
                            setNotes(entry.notes || "");
                            setEditingEntry(entry);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeletingEntryId(entry.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Duplicate confirmation dialog */}
      <AlertDialog open={showDuplicateWarning} onOpenChange={setShowDuplicateWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Potential Duplicate Entry
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>
                  An entry for <strong>{service}</strong> on{" "}
                  <strong>{new Date(eventDate + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</strong>{" "}
                  already exists with{" "}
                  <strong>{matchingEntries[0]?.sanctuary_attendance} sanctuary</strong> and{" "}
                  <strong>{matchingEntries[0]?.adjusted_total} total</strong>.
                </p>
                <p className="mt-2">What would you like to do?</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
              onClick={async () => {
                setShowDuplicateWarning(false);
                // Override: delete existing, then save new
                for (const entry of matchingEntries) {
                  await supabase.from("attendance").delete().eq("id", entry.id);
                }
                await doSave();
              }}
            >
              Replace Existing
            </AlertDialogAction>
            <AlertDialogAction
              onClick={async () => {
                setShowDuplicateWarning(false);
                await doSave();
              }}
            >
              Add as Duplicate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="bg-card rounded-2xl shadow-card p-6">
        <h3 className="font-display font-semibold text-foreground mb-2 flex items-center gap-2">
          <Upload className="h-4 w-4" /> CSV Import
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Columns: <code className="bg-muted px-1 rounded">event_date, service, sanctuary, online, nursery, k3, grade_4_6, youth, volunteers, notes</code>
        </p>
        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-border cursor-pointer hover:bg-muted transition-colors">
          <Upload className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Choose CSV file</span>
          <input type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
        </label>
      </div>

      <RecentEntries
        table="attendance"
        title="Recent Attendance Entries"
        orderBy="event_date"
        columns={[
          { key: "event_date", label: "Date" },
          { key: "service", label: "Service" },
          { key: "sanctuary_attendance", label: "Sanctuary" },
          { key: "online_attendance", label: "Online" },
          { key: "adjusted_total", label: "Total" },
        ]}
      />
    </div>
  );
};

export default AttendanceEntry;
