import { useState, useMemo } from "react";
import { useMembers, dbStageToRoadmap } from "../hooks/useRoadmapData";
import { STAGE_NAMES, type Stage } from "../types";
import { Input } from "@/components/ui/input";
import { Mail, Phone, Home } from "lucide-react";

export default function PeopleTab() {
  const { data: members = [] } = useMembers();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return members.filter((m: any) => `${m.first_name} ${m.last_name}`.toLowerCase().includes(ql));
  }, [members, q]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 space-y-10">
      <section>
        <div className="eyebrow mb-3">— The Family</div>
        <h1 className="font-display text-5xl md:text-6xl font-black text-foreground">
          Every name. <em className="font-serif-italic gradient-gold-text font-semibold not-italic-mark">Every stage.</em>
        </h1>
        <p className="text-muted-foreground mt-4 max-w-3xl">
          Synced from Planning Center. Click a tile to open the person drawer with stage history and pastoral notes.
        </p>
      </section>

      <Input placeholder="Search people…" value={q} onChange={(e) => setQ(e.target.value)}
        className="max-w-md bg-card border-border" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map((m: any) => {
          const stage = dbStageToRoadmap(m.discipleship_stage);
          const initials = `${m.first_name?.[0] || ""}${m.last_name?.[0] || ""}`;
          const stageDays = m.stage_updated_at
            ? Math.floor((Date.now() - new Date(m.stage_updated_at).getTime()) / 86400000)
            : null;
          return (
            <div key={m.id} className="group rounded-xl border border-border/60 bg-card p-4 hover:border-accent/40 transition cursor-pointer flex flex-col gap-3">
              <div className="flex items-start gap-3">
                {m.photo_url ? (
                  <img src={m.photo_url} alt={`${m.first_name} ${m.last_name}`}
                    className="h-12 w-12 rounded-full object-cover ring-2"
                    style={{ ['--tw-ring-color' as any]: `hsl(var(--stage-${stage}) / 0.5)` }} />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full font-mono text-xs font-bold shrink-0"
                    style={{ background: `hsl(var(--stage-${stage}) / 0.2)`, color: `hsl(var(--stage-${stage}))` }}>
                    {initials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-display font-semibold truncate">{m.first_name} {m.last_name}</div>
                  <div className="font-mono text-[10px] uppercase tracking-wider"
                    style={{ color: `hsl(var(--stage-${stage}))` }}>
                    {STAGE_NAMES[stage]}
                    {stageDays !== null && <span className="text-muted-foreground ml-2 normal-case tracking-normal">· {stageDays}d</span>}
                  </div>
                  {m.household_name && (
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1 truncate">
                      <Home className="h-3 w-3 shrink-0" /> <span className="truncate">{m.household_name}</span>
                    </div>
                  )}
                </div>
              </div>
              {(m.email || m.phone) && (
                <div className="border-t border-border/40 pt-2 space-y-1 text-[11px] text-muted-foreground">
                  {m.email && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="h-3 w-3 shrink-0" /> <span className="truncate">{m.email}</span>
                    </div>
                  )}
                  {m.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 shrink-0" /> <span>{m.phone}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && <p className="col-span-full text-center text-muted-foreground italic py-12">No matches.</p>}
      </div>
    </div>
  );
}
