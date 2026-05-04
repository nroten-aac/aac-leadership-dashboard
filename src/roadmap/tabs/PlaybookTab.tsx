import { Link } from "react-router-dom";
import { LAWS } from "../seed";
import { useLawStatusOverrides } from "../hooks/useRoadmapData";
import { LAW_SVGS } from "../illustrations";

const STATUS_STYLES: Record<string, string> = {
  "in-progress": "border-accent/50 bg-accent/10 text-accent",
  pending: "border-border bg-muted/30 text-muted-foreground",
  complete: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
};
const STATUS_LABEL: Record<string, string> = { "in-progress": "IN PROGRESS", pending: "PENDING", complete: "COMPLETE" };

export default function PlaybookTab() {
  const { data: statusMap = {} } = useLawStatusOverrides();
  const laws = LAWS.map((l) => ({ ...l, status: statusMap[l.n] ?? l.status }));
  const ready = laws.filter((l) => l.insights && l.insights.length > 0).length;

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 space-y-10">
      <section>
        <div className="eyebrow mb-3">— The Playbook · 12 Laws</div>
        <h1 className="font-display text-5xl md:text-6xl font-black text-foreground">
          Twelve laws. <em className="font-serif-italic gradient-gold-text font-semibold not-italic-mark">One mission.</em>
        </h1>
        <p className="text-muted-foreground mt-4 max-w-3xl">
          Chip Ingram's High-Impact Church framework — adapted, prayed over, and put to work in Ashe County.
        </p>
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div><div className="font-display text-4xl font-black gradient-gold-text">{ready}</div><div className="eyebrow text-[10px] mt-1">Complete with content</div></div>
          <div><div className="font-display text-4xl font-black text-foreground">{laws.length}</div><div className="eyebrow text-[10px] mt-1">Laws to live by</div></div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {laws.map((l) => {
          const isReady = l.insights && l.insights.length > 0;
          return (
            <Link to={`/members/playbook/${l.n}`} key={l.n}
              className={`group relative rounded-2xl border p-5 transition hover:scale-[1.01] hover:shadow-card-hover cursor-pointer block ${
              l.status === "in-progress" ? "border-accent/40 bg-card shadow-card" : "border-border/60 bg-card/60"
            }`}>
              <div className={`mb-4 h-12 w-12 ${isReady ? "text-accent" : "text-muted-foreground/50"}`}
                dangerouslySetInnerHTML={{ __html: LAW_SVGS[l.n] || "" }} />
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className={`font-display text-2xl font-black ${l.status === "in-progress" ? "gradient-gold-text" : "text-muted-foreground/50"}`}>{l.n}</span>
                <span className={`rounded-full border px-2 py-0.5 font-mono text-[9px] tracking-wider ${STATUS_STYLES[l.status]}`}>
                  {STATUS_LABEL[l.status]}
                </span>
              </div>
              <h3 className="font-display text-lg font-bold leading-tight">
                The Law of <em className="font-serif-italic gradient-gold-text font-semibold not-italic-mark">{l.accent}</em>
              </h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{l.subtitle}</p>
              <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                <span>▶ {l.duration}</span>
                <span className="text-accent opacity-0 group-hover:opacity-100 transition">→</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
