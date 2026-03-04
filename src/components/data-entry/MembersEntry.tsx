import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Upload } from "lucide-react";

const STATUSES = ["active", "inactive", "visitor", "transferred"];
const GENDERS = ["Male", "Female"];

const MembersEntry = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState("active");
  const [membershipDate, setMembershipDate] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName) {
      toast({ title: "Missing fields", description: "First and last name are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("members").insert({
      first_name: firstName,
      last_name: lastName,
      email: email || null,
      phone: phone || null,
      gender: gender || null,
      date_of_birth: dob || null,
      address: address || null,
      membership_status: status,
      membership_date: membershipDate || new Date().toISOString().split("T")[0],
      notes: notes || null,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Member added", description: `${firstName} ${lastName} has been added.` });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      setFirstName(""); setLastName(""); setEmail(""); setPhone(""); setGender(""); setDob(""); setAddress(""); setNotes("");
    }
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split("\n").filter(l => l.trim());
    // Expect: first_name,last_name,email,phone,gender,date_of_birth,address,membership_status,membership_date,notes
    const rows = lines.slice(1).map(line => {
      const c = line.split(",").map(s => s.trim().replace(/^"|"$/g, ""));
      return {
        first_name: c[0], last_name: c[1], email: c[2] || null, phone: c[3] || null,
        gender: c[4] || null, date_of_birth: c[5] || null, address: c[6] || null,
        membership_status: c[7] || "active", membership_date: c[8] || new Date().toISOString().split("T")[0],
        notes: c[9] || null,
      };
    }).filter(r => r.first_name && r.last_name);

    if (!rows.length) {
      toast({ title: "No valid rows", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("members").insert(rows);
    if (error) toast({ title: "Import error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Imported", description: `${rows.length} members imported.` });
      queryClient.invalidateQueries({ queryKey: ["members"] });
    }
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-2xl shadow-card p-6">
        <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Member
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label>First Name *</Label>
              <Input value={firstName} onChange={e => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Last Name *</Label>
              <Input value={lastName} onChange={e => setLastName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Date of Birth</Label>
              <Input type="date" value={dob} onChange={e => setDob(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Membership Date</Label>
              <Input type="date" value={membershipDate} onChange={e => setMembershipDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input value={address} onChange={e => setAddress(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Add Member"}</Button>
        </form>
      </div>

      <div className="bg-card rounded-2xl shadow-card p-6">
        <h3 className="font-display font-semibold text-foreground mb-2 flex items-center gap-2">
          <Upload className="h-4 w-4" /> CSV Import
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Columns: <code className="bg-muted px-1 rounded">first_name, last_name, email, phone, gender, date_of_birth, address, membership_status, membership_date, notes</code>
        </p>
        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-border cursor-pointer hover:bg-muted transition-colors">
          <Upload className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Choose CSV file</span>
          <input type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
        </label>
      </div>
    </div>
  );
};

export default MembersEntry;
