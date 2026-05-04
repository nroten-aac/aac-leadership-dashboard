import { useState } from "react";
import { useVision } from "../hooks/useRoadmapData";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function VisionBanner() {
  const { vision, save } = useVision();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  if (editing) {
    return (
      <div className="rounded-2xl border border-accent/40 bg-gradient-to-br from-card to-background p-6 shadow-card">
        <div className="eyebrow mb-2">AAC Vision · Drafting</div>
        <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3}
          placeholder="Ashe Alliance exists to make and multiply disciples of every generation in Ashe County and beyond."
          className="bg-muted/50 border-border text-base" />
        <div className="mt-3 flex gap-2">
          <Button size="sm" onClick={() => { save(draft); setEditing(false); }}
            className="bg-accent text-accent-foreground hover:bg-accent/90">
            Pin the Vision
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      </div>
    );
  }

  if (!vision) {
    return (
      <div className="rounded-2xl border border-accent/30 bg-gradient-to-br from-card via-background to-card p-6 shadow-card">
        <div className="eyebrow mb-2">AAC Vision · Not yet set</div>
        <p className="font-serif-italic text-muted-foreground leading-relaxed">
          "By the time you're tired of saying it, people are just starting to get it." — Jim Wiegland.
          Once you finalize a draft (Phase 1, Law 01), pin it here. It will appear on every Today landing.
        </p>
        <Button size="sm" onClick={() => { setDraft(""); setEditing(true); }}
          className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90 rounded-full">
          Set the Vision →
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-accent/40 bg-gradient-to-br from-primary/30 to-card p-6 shadow-card">
      <div className="flex items-center justify-between gap-4 mb-2">
        <div className="eyebrow">AAC Vision · Pinned</div>
        <button onClick={() => { setDraft(vision); setEditing(true); }}
          className="text-xs text-muted-foreground hover:text-accent transition">edit</button>
      </div>
      <p className="font-display text-2xl font-semibold text-foreground leading-snug">{vision}</p>
    </div>
  );
}
