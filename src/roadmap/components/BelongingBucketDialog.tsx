import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const MEMBER_COLOR = "hsl(199 89% 60%)";
const REGULAR_COLOR = "hsl(258 80% 72%)";
const RING = "hsl(280 85% 68%)";

export type BelongingBucket = "member" | "regular";

const displayName = (m: any) =>
  `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim() || "Unnamed";

function isInRhythm(m: any) {
  const rs = Array.isArray(m.rhythms) ? m.rhythms : [];
  return rs.length > 0 || m.phase === "rhythms";
}

interface Props {
  bucket: BelongingBucket | null;
  members: any[];
  onClose: () => void;
}

export default function BelongingBucketDialog({ bucket, members, onClose }: Props) {
  if (!bucket) return null;
  const isMember = bucket === "member";
  const color = isMember ? MEMBER_COLOR : REGULAR_COLOR;
  const label = isMember ? "Members" : "Regular Attenders";
  const inRhythm = members.filter(isInRhythm);
  const noRhythm = members.filter((m) => !isInRhythm(m));

  const intro = isMember
    ? "Already through both doorways. The next move is a rhythm — Maturing, Ministering, or Multiplying."
    : "Not yet through the membership doorway. The next move depends on where they are.";

  const rhythmHeader = isMember
    ? "In a rhythm — healthy, keep investing"
    : "In a rhythm — invite to membership";

  const noRhythmHeader = isMember
    ? "No rhythm yet — activate them"
    : "No rhythm yet — deepen connection";

  const chip = (m: any, opts: { dashed?: boolean; ring?: boolean }) => (
    <span
      key={m.id}
      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] text-foreground"
      style={{
        border: opts.dashed ? `1.5px dashed ${color}` : `1.5px solid ${color}`,
        background: "hsl(var(--background) / 0.4)",
        boxShadow: opts.ring
          ? `0 0 0 2px hsl(var(--card)), 0 0 0 3.5px ${RING}`
          : undefined,
      }}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{
          background: opts.dashed ? "transparent" : color,
          border: opts.dashed ? `1.5px dashed ${color}` : `1.5px solid ${color}`,
        }}
      />
      {displayName(m)}
    </span>
  );

  return (
    <Dialog open={!!bucket} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl p-0 bg-card border-border max-h-[85vh] overflow-hidden">
        <div className="p-6 border-b border-border/60">
          <div className="eyebrow">— Belonging · {label}</div>
          <h2 className="font-display text-3xl font-bold mt-1" style={{ color }}>
            {label}{" "}
            <span className="text-muted-foreground/70 font-mono text-lg">· {members.length}</span>
          </h2>
          <p className="font-serif-italic text-muted-foreground mt-2">{intro}</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: color, border: `1.5px solid ${color}` }} />
              Solid = in a rhythm
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ border: `1.5px dashed ${color}` }} />
              Dashed = needs to move
            </span>
            {!isMember && (
              <span className="inline-flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    background: color,
                    boxShadow: `0 0 0 2px hsl(var(--card)), 0 0 0 3.5px ${RING}`,
                  }}
                />
                Violet ring = invite to membership
              </span>
            )}
          </div>
        </div>
        <ScrollArea className="max-h-[65vh]">
          <div className="p-6 space-y-6">
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="eyebrow">— {rhythmHeader}</div>
                <div className="font-mono text-[10px] text-muted-foreground">{inRhythm.length}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {inRhythm.length === 0 && (
                  <span className="text-[11px] text-muted-foreground/70">No one here.</span>
                )}
                {inRhythm.map((m) => chip(m, { ring: !isMember }))}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="eyebrow">— {noRhythmHeader}</div>
                <div className="font-mono text-[10px] text-muted-foreground">{noRhythm.length}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {noRhythm.length === 0 && (
                  <span className="text-[11px] text-muted-foreground/70">No one here.</span>
                )}
                {noRhythm.map((m) => chip(m, { dashed: true }))}
              </div>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}