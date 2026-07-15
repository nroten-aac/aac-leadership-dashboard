import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const MEMBER_COLOR = "hsl(199 89% 60%)";
const REGULAR_COLOR = "hsl(210 80% 40%)";
const RING = REGULAR_COLOR;

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
  onSelectPerson?: (m: any) => void;
}

export default function BelongingBucketDialog({ bucket, members, onClose, onSelectPerson }: Props) {
  if (!bucket) return null;
  const isMember = bucket === "member";
  const color = isMember ? MEMBER_COLOR : REGULAR_COLOR;
  const label = isMember ? "Members" : "Regular Attenders";
  const inRhythm = members.filter(isInRhythm);
  const noRhythm = members.filter((m) => !isInRhythm(m));

  const intro = isMember
    ? "Members who haven't yet stepped into a rhythm — Maturing, Ministering, or Multiplying. The next pastoral move is activation."
    : "Not yet through the membership doorway. The next move depends on where they are.";

  const chip = (m: any, opts: { dashed?: boolean; ring?: boolean }) => (
    <button
      key={m.id}
      type="button"
      onClick={() => onSelectPerson?.(m)}
      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] text-foreground hover:brightness-125 hover:-translate-y-px transition"
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
    </button>
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
          {!isMember && (
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-muted-foreground">
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
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ border: `1.5px dashed ${color}` }} />
                Dashed = no rhythm yet · deepen connection
              </span>
            </div>
          )}
        </div>
        <ScrollArea className="max-h-[65vh]">
          <div className="p-6 space-y-6">
            {isMember ? (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <div className="eyebrow">— No rhythm yet · activate them</div>
                  <div className="font-mono text-[10px] text-muted-foreground">{noRhythm.length}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {noRhythm.length === 0 && (
                    <span className="text-[11px] text-muted-foreground/70">Every member is already in a rhythm. Keep investing.</span>
                  )}
                  {noRhythm.map((m) => chip(m, { dashed: true }))}
                </div>
              </section>
            ) : (
              <>
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <div className="eyebrow">— In a rhythm · invite to membership</div>
                    <div className="font-mono text-[10px] text-muted-foreground">{inRhythm.length}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {inRhythm.length === 0 && (
                      <span className="text-[11px] text-muted-foreground/70">No one here.</span>
                    )}
                    {inRhythm.map((m) => chip(m, { ring: true }))}
                  </div>
                </section>
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <div className="eyebrow">— No rhythm yet · deepen connection</div>
                    <div className="font-mono text-[10px] text-muted-foreground">{noRhythm.length}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {noRhythm.length === 0 && (
                      <span className="text-[11px] text-muted-foreground/70">No one here.</span>
                    )}
                    {noRhythm.map((m) => chip(m, { dashed: true }))}
                  </div>
                </section>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}