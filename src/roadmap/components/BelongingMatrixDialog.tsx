import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const MEMBER_COLOR = "hsl(199 89% 60%)";
const REGULAR_COLOR = "hsl(258 80% 72%)";
const RING = "hsl(280 85% 68%)";

export interface BelongingBuckets {
  membersInRhythm: any[];
  membersNoRhythm: any[];
  regularsInRhythm: any[];
  regularsNoRhythm: any[];
}

const displayName = (m: any) =>
  `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim() || "Unnamed";

export default function BelongingMatrixDialog({
  open,
  onClose,
  buckets,
}: {
  open: boolean;
  onClose: () => void;
  buckets: BelongingBuckets;
}) {
  const cells = [
    {
      title: "Members · in a rhythm",
      note: "Healthy — keep investing",
      people: buckets.membersInRhythm,
      color: MEMBER_COLOR,
    },
    {
      title: "Members · no rhythm yet",
      note: "Activate — connect them into a rhythm",
      people: buckets.membersNoRhythm,
      color: MEMBER_COLOR,
      urgent: true,
    },
    {
      title: "Regulars · in a rhythm",
      note: "Invite to membership",
      people: buckets.regularsInRhythm,
      color: REGULAR_COLOR,
      urgent: true,
    },
    {
      title: "Regulars · no rhythm yet",
      note: "Deepen connection",
      people: buckets.regularsNoRhythm,
      color: REGULAR_COLOR,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl p-0 bg-card border-border max-h-[85vh] overflow-hidden">
        <div className="p-6 border-b border-border/60">
          <div className="eyebrow">— Belonging matrix</div>
          <h2 className="font-display text-3xl font-bold text-foreground mt-1">
            Two axes, <em className="font-serif-italic text-accent">four pastoral moves.</em>
          </h2>
          <p className="font-serif-italic text-muted-foreground mt-2">
            Membership on one axis, rhythm participation on the other. Each quadrant is a distinct invitation.
          </p>
        </div>
        <ScrollArea className="max-h-[65vh]">
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {cells.map((c) => (
              <div
                key={c.title}
                className="rounded-xl border p-4"
                style={{
                  borderColor: c.urgent ? RING : "hsl(var(--border))",
                  background: c.urgent ? "hsl(280 85% 68% / 0.06)" : "hsl(var(--background) / 0.4)",
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-display font-semibold text-foreground">{c.title}</div>
                  <div className="font-mono text-xs text-muted-foreground">{c.people.length}</div>
                </div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-accent mb-3">
                  {c.note}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {c.people.length === 0 && (
                    <span className="text-[11px] text-muted-foreground/70">No one here.</span>
                  )}
                  {c.people.slice(0, 80).map((m) => (
                    <span
                      key={m.id}
                      className="rounded-full border px-2 py-0.5 text-[11px] text-foreground"
                      style={{ borderColor: c.color, background: `${c.color.replace("hsl(", "hsl(").replace(")", " / 0.12)")}` }}
                      title={displayName(m)}
                    >
                      {displayName(m)}
                    </span>
                  ))}
                  {c.people.length > 80 && (
                    <span className="text-[11px] text-muted-foreground">
                      +{c.people.length - 80} more
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}