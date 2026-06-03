import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, Home, ArrowRight, ArrowLeft, Check, Pencil, Trash2, X, Sparkles } from "lucide-react";
import { STAGE_NAMES, STAGE_ORDER, STAGE_DESC, type Stage } from "../types";
import { dbStageToRoadmap } from "../hooks/useRoadmapData";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/hooks/use-toast";

type Phase = "connecting" | "belonging" | "rhythms";
type Rhythm = "maturing" | "ministering" | "multiplying";

const PHASE_LABEL: Record<Phase, string> = {
  connecting: "Connecting",
  belonging: "Belonging",
  rhythms: "Rhythms",
};

const RHYTHM_META: Record<Rhythm, { label: string; stage: Stage; sub: string }> = {
  maturing:    { label: "Maturing",    stage: "mature",   sub: "Growing in Christ" },
  ministering: { label: "Ministering", stage: "minister", sub: "Serving His body" },
  multiplying: { label: "Multiplying", stage: "multiply", sub: "Making disciples" },
};

interface Props {
  member: any | null;
  onOpenChange: (open: boolean) => void;
  discKeys: string[];
  volTeams: string[];
  discLabel: (k: string) => string;
  status?: "member" | "regular" | "visitor" | null;
}

const STATUS_STYLE = {
  member:  { label: "Member",  dot: "bg-sky-400",    bg: "bg-sky-500/10",    text: "text-sky-300",    border: "border-sky-500/40" },
  regular: { label: "Regular", dot: "bg-violet-400", bg: "bg-violet-500/10", text: "text-violet-300", border: "border-violet-500/40" },
  visitor: { label: "Visitor", dot: "bg-amber-400",  bg: "bg-amber-500/10",  text: "text-amber-300",  border: "border-amber-500/40" },
} as const;

export default function PersonDrawer({ member, onOpenChange, discKeys, volTeams, discLabel, status }: Props) {
  const qc = useQueryClient();
  const open = !!member;
  const phase: Phase = (member?.phase as Phase) || "connecting";
  const currentRhythms: Rhythm[] = useMemo(
    () => (Array.isArray(member?.rhythms) ? (member.rhythms as Rhythm[]) : []),
    [member?.rhythms]
  );
  // For legacy header chip / history coloring we still derive a primary stage
  const stage: Stage = member ? dbStageToRoadmap(member.discipleship_stage) : "connect";

  const stageDays = member?.stage_updated_at
    ? Math.floor((Date.now() - new Date(member.stage_updated_at).getTime()) / 86400000)
    : null;

  // Pastoral note
  const { data: noteRow } = useQuery({
    queryKey: ["pastoral_note", member?.id],
    queryFn: async () => {
      if (!member?.id) return null;
      const { data } = await supabase.from("pastoral_notes" as any).select("note").eq("member_id", member.id).maybeSingle();
      return data as any;
    },
    enabled: !!member?.id,
  });
  const [note, setNote] = useState("");
  useEffect(() => { setNote((noteRow as any)?.note ?? ""); }, [noteRow, member?.id]);

  const saveNote = useMutation({
    mutationFn: async (value: string) => {
      const { error } = await supabase
        .from("pastoral_notes" as any)
        .upsert(
          { member_id: member.id, note: value, updated_at: new Date().toISOString() } as any,
          { onConflict: "member_id" } as any
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pastoral_note", member?.id] });
      toast({ title: "Pastoral note saved" });
    },
    onError: (e: any) => toast({ title: "Could not save note", description: e?.message ?? String(e), variant: "destructive" }),
  });

  // Stage history
  const { data: history = [] } = useQuery({
    queryKey: ["stage_history", member?.id],
    queryFn: async () => {
      if (!member?.id) return [];
      const { data } = await supabase.from("discipleship_stage_history" as any)
        .select("id, previous_stage, new_stage, changed_at")
        .eq("member_id", member.id)
        .order("changed_at", { ascending: false })
        .limit(10);
      return (data as any[]) || [];
    },
    enabled: !!member?.id,
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDate, setEditingDate] = useState<string>("");

  const updateHistoryDate = useMutation({
    mutationFn: async ({ id, date }: { id: string; date: string }) => {
      await supabase.from("discipleship_stage_history" as any)
        .update({ changed_at: new Date(date).toISOString() } as any)
        .eq("id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stage_history", member?.id] });
      setEditingId(null);
    },
  });

  const deleteHistory = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("discipleship_stage_history" as any).delete().eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stage_history", member?.id] }),
  });

  // Save phase + rhythms (source of truth — discipleship_stage auto-syncs via DB trigger)
  const savePhase = useMutation({
    mutationFn: async ({ phase: p, rhythms: r }: { phase: Phase; rhythms: Rhythm[] }) => {
      const payload: any = {
        phase: p,
        rhythms: p === "rhythms" ? r : [],
        stage_updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("members").update(payload).eq("id", member.id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["roadmap", "members"] });
      qc.invalidateQueries({ queryKey: ["stage_history", member?.id] });
      qc.invalidateQueries({ queryKey: ["shepherding-members"] });
      const label =
        vars.phase === "rhythms"
          ? `Now in rhythms: ${vars.rhythms.map((r) => RHYTHM_META[r].label).join(", ")}`
          : `Moved to ${PHASE_LABEL[vars.phase]}`;
      toast({ title: label });
    },
    onError: (e: any) =>
      toast({ title: "Could not update", description: e?.message ?? String(e), variant: "destructive" }),
  });

  const toggleRhythm = (r: Rhythm) => {
    const next = currentRhythms.includes(r)
      ? currentRhythms.filter((x) => x !== r)
      : [...currentRhythms, r];
    if (next.length === 0) {
      // dropping the last rhythm sends them back to Belonging
      savePhase.mutate({ phase: "belonging", rhythms: [] });
    } else {
      savePhase.mutate({ phase: "rhythms", rhythms: next });
    }
  };

  const setPhase = (p: Phase) => {
    if (p === "rhythms") {
      // Entering rhythms with no selection isn't valid — default to maturing
      savePhase.mutate({ phase: "rhythms", rhythms: currentRhythms.length ? currentRhythms : ["maturing"] });
    } else {
      savePhase.mutate({ phase: p, rhythms: [] });
    }
  };

  if (!member) return null;
  const initials = `${member.first_name?.[0] || ""}${member.last_name?.[0] || ""}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto border-border p-0 dark bg-background text-foreground">
        {/* Header */}
        <div className="p-6 border-b border-border/60">
          <div className="flex items-start gap-4">
            {member.photo_url ? (
              <img src={member.photo_url} alt="" className="h-16 w-16 rounded-full object-cover ring-2"
                style={{ ['--tw-ring-color' as any]: `hsl(var(--stage-${stage}) / 0.5)` }} />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full font-mono text-base font-bold shrink-0"
                style={{ background: `hsl(var(--stage-${stage}) / 0.2)`, color: `hsl(var(--stage-${stage}))` }}>
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-2xl font-bold">{member.first_name} {member.last_name}</h2>
              {member.household_name && (
                <div className="font-mono text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                  <Home className="h-3 w-3" /> {member.household_name}
                </div>
              )}
              <span className="inline-flex items-center gap-1.5 mt-2 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider"
                style={{ borderColor: `hsl(var(--stage-${stage}) / 0.5)`, color: `hsl(var(--stage-${stage}))`, background: `hsl(var(--stage-${stage}) / 0.1)` }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: `hsl(var(--stage-${stage}))` }} /> {STAGE_NAMES[stage]}
              </span>
              {status && (
                <span className={`inline-flex items-center gap-1.5 mt-2 ml-2 rounded-full border ${STATUS_STYLE[status].border} ${STATUS_STYLE[status].bg} ${STATUS_STYLE[status].text} px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${STATUS_STYLE[status].dot}`} />
                  {STATUS_STYLE[status].label}
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-border/60 bg-background/40 p-3 text-sm">
            <span className="font-serif-italic text-muted-foreground">In this stage </span>
            <span className="font-bold">{stageDays ?? "—"} days</span>
            <span className="text-muted-foreground"> · {STAGE_DESC[stage]}</span>
          </div>
        </div>

        {/* Engagement */}
        <div className="p-6 border-b border-border/60 space-y-4">
          <div>
            <div className="eyebrow mb-2 text-accent">📖 Maturing in</div>
            <div className="flex flex-wrap gap-2">
              {discKeys.length === 0 && <span className="text-xs text-muted-foreground italic">Not in a discipleship group</span>}
              {discKeys.map((k) => (
                <span key={k} className="rounded-full border border-accent/40 bg-accent/10 text-accent px-3 py-1 font-mono text-[10px] tracking-wider">
                  {discLabel(k)}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="eyebrow mb-2 text-emerald-400">🤝 Ministering on</div>
            <div className="flex flex-wrap gap-2">
              {volTeams.length === 0 && <span className="text-xs text-muted-foreground italic">Not on a serve team</span>}
              {volTeams.map((t) => (
                <span key={t} className="rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 px-3 py-1 font-mono text-[10px] tracking-wider">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Primary action — phase-aware */}
        <div className="p-6 border-b border-border/60">
          <div className="eyebrow mb-3">Where are they?</div>

          {/* Phase pills (exclusive) */}
          <div className="grid grid-cols-3 gap-1.5 mb-4">
            {(["connecting", "belonging", "rhythms"] as Phase[]).map((p) => {
              const active = phase === p;
              const swatch =
                p === "connecting" ? "connect" : p === "belonging" ? "belong" : "multiply";
              return (
                <button
                  key={p}
                  onClick={() => !active && setPhase(p)}
                  disabled={savePhase.isPending}
                  className={`rounded-xl border px-2 py-2 font-mono text-[10px] uppercase tracking-wider transition ${
                    active ? "border-transparent text-background font-bold" : "border-border bg-background/40 text-muted-foreground hover:text-foreground hover:border-foreground/40"
                  }`}
                  style={
                    active
                      ? { background: `hsl(var(--stage-${swatch}))`, color: "hsl(var(--background))" }
                      : undefined
                  }
                >
                  {PHASE_LABEL[p]}
                </button>
              );
            })}
          </div>

          {/* Phase-specific next step */}
          {phase === "connecting" && (
            <button
              onClick={() => setPhase("belonging")}
              disabled={savePhase.isPending}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 font-mono text-[11px] tracking-wider text-accent-foreground font-bold hover:scale-[1.01] transition shadow-[0_0_30px_hsl(var(--accent)/0.3)]"
            >
              MOVE TO BELONGING <ArrowRight className="h-4 w-4" />
            </button>
          )}

          {phase === "belonging" && (
            <>
              <p className="font-mono text-[10px] text-muted-foreground mb-2">
                Tap one or more rhythms to mark how they're growing. They can live in all three at once.
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {(Object.keys(RHYTHM_META) as Rhythm[]).map((r) => {
                  const meta = RHYTHM_META[r];
                  return (
                    <button
                      key={r}
                      onClick={() => toggleRhythm(r)}
                      disabled={savePhase.isPending}
                      className="flex items-center justify-between rounded-xl border border-border bg-background/40 px-3 py-2.5 text-left hover:border-foreground/40 transition"
                    >
                      <div>
                        <div className="font-display font-bold text-sm" style={{ color: `hsl(var(--stage-${meta.stage}))` }}>
                          {meta.label}
                        </div>
                        <div className="font-serif-italic text-[11px] text-muted-foreground">{meta.sub}</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {phase === "rhythms" && (
            <>
              <p className="font-mono text-[10px] text-muted-foreground mb-2">
                Toggle any combination — a person can be growing in all three at once.
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {(Object.keys(RHYTHM_META) as Rhythm[]).map((r) => {
                  const meta = RHYTHM_META[r];
                  const on = currentRhythms.includes(r);
                  return (
                    <button
                      key={r}
                      onClick={() => toggleRhythm(r)}
                      disabled={savePhase.isPending}
                      className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left transition ${
                        on ? "border-transparent" : "border-border bg-background/40 hover:border-foreground/40"
                      }`}
                      style={
                        on
                          ? {
                              background: `hsl(var(--stage-${meta.stage}) / 0.35)`,
                              borderColor: `hsl(var(--stage-${meta.stage}) / 0.7)`,
                            }
                          : undefined
                      }
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0"
                          style={{ borderColor: `hsl(var(--stage-${meta.stage}))`, background: on ? `hsl(var(--stage-${meta.stage}))` : "transparent" }}
                        >
                          {on && <Check className="h-3 w-3 text-background" strokeWidth={3} />}
                        </span>
                        <div>
                          <div className="font-display font-bold text-sm" style={{ color: `hsl(var(--stage-${meta.stage}))` }}>
                            {meta.label}
                          </div>
                          <div className="font-serif-italic text-[11px] text-muted-foreground">{meta.sub}</div>
                        </div>
                      </div>
                      {on && currentRhythms.length === 3 && (
                        <Sparkles className="h-4 w-4 text-accent" />
                      )}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setPhase("belonging")}
                disabled={savePhase.isPending}
                className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background/40 px-4 py-2 font-mono text-[10px] tracking-wider text-muted-foreground hover:text-foreground hover:border-foreground/40 transition"
              >
                <ArrowLeft className="h-4 w-4" /> RETURN TO BELONGING
              </button>
            </>
          )}
        </div>

        {/* Pastoral note */}
        <div className="p-6 border-b border-border/60">
          <div className="flex items-center justify-between mb-2">
            <div className="eyebrow">Pastoral note</div>
            <button
              onClick={() => saveNote.mutate(note)}
              className="font-mono text-[10px] text-accent hover:underline"
            >
              {saveNote.isPending ? "saving…" : "save"}
            </button>
          </div>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What prompted this update? Conversations, milestones, prayer requests…"
            className="min-h-[100px] bg-background/40 border-border resize-none font-serif-italic text-sm"
          />
        </div>

        {/* Contact */}
        {(member.email || member.phone) && (
          <div className="p-6 border-b border-border/60">
            <div className="eyebrow mb-2">Contact</div>
            <div className="space-y-1.5 text-sm">
              {member.email && (
                <a href={`mailto:${member.email}`} className="flex items-center gap-2 text-accent hover:underline">
                  <Mail className="h-3.5 w-3.5" /> {member.email}
                </a>
              )}
              {member.phone && (
                <a href={`tel:${member.phone}`} className="flex items-center gap-2 text-accent hover:underline">
                  <Phone className="h-3.5 w-3.5" /> {member.phone}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Stage history */}
        <div className="p-6 border-b border-border/60">
          <div className="flex items-center justify-between mb-3">
            <div className="eyebrow">Stage history</div>
            <span className="font-mono text-[9px] text-muted-foreground">tap date to edit</span>
          </div>
          {history.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No transitions recorded yet.</p>
          ) : (
            <div className="space-y-2.5">
              {history.map((h: any, i: number) => {
                const from = h.previous_stage ? dbStageToRoadmap(h.previous_stage) : null;
                const to = dbStageToRoadmap(h.new_stage);
                const isEditing = editingId === h.id;
                return (
                  <div key={h.id} className="flex items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {from && (
                        <>
                          <span className="rounded px-1.5 py-0.5 font-mono text-[10px]" style={{ background: `hsl(var(--stage-${from}) / 0.15)`, color: `hsl(var(--stage-${from}))` }}>
                            {STAGE_NAMES[from]}
                          </span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        </>
                      )}
                      <span className="rounded px-1.5 py-0.5 font-mono text-[10px]" style={{ background: `hsl(var(--stage-${to}) / 0.15)`, color: `hsl(var(--stage-${to}))` }}>
                        {STAGE_NAMES[to]}
                      </span>
                    </div>
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="date"
                          value={editingDate}
                          onChange={(e) => setEditingDate(e.target.value)}
                          className="bg-background border border-border rounded px-1.5 py-0.5 font-mono text-[10px] text-foreground"
                        />
                        <button
                          onClick={() => updateHistoryDate.mutate({ id: h.id, date: editingDate })}
                          className="p-1 rounded hover:bg-emerald-500/20 text-emerald-400"
                          title="Save"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 rounded hover:bg-muted text-muted-foreground"
                          title="Cancel"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => { if (confirm("Delete this transition?")) deleteHistory.mutate(h.id); }}
                          className="p-1 rounded hover:bg-destructive/20 text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingId(h.id);
                          setEditingDate(new Date(h.changed_at).toISOString().slice(0, 10));
                        }}
                        className="group flex items-center gap-1 text-muted-foreground font-mono text-[10px] hover:text-accent transition"
                      >
                        <span>{formatDistanceToNow(new Date(h.changed_at), { addSuffix: true })}</span>
                        <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="rounded-xl border border-border/60 bg-background/40 p-3 text-[11px] text-muted-foreground font-mono leading-relaxed">
            ⓘ Profile data syncs from <span className="text-accent font-bold">Planning Center</span>. Email, phone, and household are read-only here. Stage and pastoral notes save to your backend.
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}