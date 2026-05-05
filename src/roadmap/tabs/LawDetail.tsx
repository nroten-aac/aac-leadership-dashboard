import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Play, Sparkles } from "lucide-react";
import { LAWS } from "../seed";
import { LAW_SVGS } from "../illustrations";
import { useLawStatusOverrides } from "../hooks/useRoadmapData";

const STATUS_LABEL: Record<string, string> = {
  "in-progress": "IN PROGRESS",
  pending: "PENDING",
  complete: "COMPLETE",
};

export default function LawDetail() {
  const { n } = useParams<{ n: string }>();
  const law = LAWS.find((l) => l.n === n);
  const { data: statusMap = {} } = useLawStatusOverrides();
  const status = law ? (statusMap[law.n] ?? law.status) : null;

  if (!law) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Law not found.</h1>
        <Link to="/members/playbook" className="text-accent mt-4 inline-block">← Back to Playbook</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 space-y-10">
      <Link
        to="/members/playbook"
        className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-2 font-mono text-[11px] tracking-wider text-muted-foreground hover:text-accent hover:border-accent/40 transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> ALL 12 LAWS
      </Link>

      <header className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-start">
        <div className="space-y-5">
          <div className="eyebrow">
            LAW {law.n} <span className="text-muted-foreground/50 mx-1">·</span> {STATUS_LABEL[law.status] ?? law.status.toUpperCase()}
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-black leading-[1.05]">
            The Law of <em className="font-serif-italic gradient-gold-text font-semibold not-italic-mark">{law.accent}</em>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">{law.subtitle}</p>
        </div>

        <div className="relative h-40 w-40 rounded-2xl border border-border/60 bg-gradient-to-br from-card to-card/40 shadow-card p-5 shrink-0">
          <ArrowRight className="absolute top-4 right-4 h-4 w-4 text-muted-foreground" />
          <div className="h-full w-full text-accent/80" dangerouslySetInnerHTML={{ __html: LAW_SVGS[law.n] || "" }} />
        </div>
      </header>

      <div className="rounded-2xl border border-border/60 bg-card/60 px-5 py-4 flex items-center gap-4">
        <button
          type="button"
          className="h-12 w-12 shrink-0 rounded-full bg-accent text-accent-foreground flex items-center justify-center hover:scale-105 transition"
          aria-label="Play audio"
        >
          <Play className="h-5 w-5 fill-current ml-0.5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="font-display text-sm font-bold">Listen · Chip Ingram</div>
          <div className="font-mono text-[11px] text-muted-foreground mt-0.5 truncate">
            The Law of {law.accent} · {law.duration}
          </div>
        </div>
        <a
          href="#"
          className="hidden sm:inline-flex items-center gap-2 rounded-full border border-accent/40 px-4 py-2 font-mono text-[10px] tracking-wider text-accent hover:bg-accent/10 transition"
        >
          OPEN IN DRIVE →
        </a>
      </div>

      {law.heroStat && (
        <section className="rounded-2xl border-l-4 border-l-accent border border-border/60 bg-card/60 p-8 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-x-10 gap-y-3 items-center shadow-card">
          <div className="font-display text-7xl md:text-8xl font-black gradient-gold-text leading-none tracking-tight">
            {law.heroStat.number}
          </div>
          <div>
            <div className="eyebrow text-accent">{law.heroStat.label}</div>
            <p className="font-serif-italic text-lg text-muted-foreground mt-2 leading-relaxed">
              {law.heroStat.text}
            </p>
          </div>
        </section>
      )}

      {law.principle && (
        <blockquote className="border-l-4 border-accent pl-6 py-2">
          <p className="font-serif-italic text-xl text-foreground leading-relaxed">"{law.principle}"</p>
          <footer className="eyebrow mt-3">— {law.principleAttr ?? "Chip Ingram"}</footer>
        </blockquote>
      )}

      {law.standfirst && <p className="text-lg leading-relaxed text-foreground">{law.standfirst}</p>}

      {law.insights && law.insights.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-3xl font-bold">Insights</h2>
          <div className="grid gap-4">
            {law.insights.map((ins, i) => (
              <div key={i} className="rounded-xl border border-border/60 bg-card p-5">
                <div className="font-mono text-xs text-accent mb-2">{String(i + 1).padStart(2, "0")}</div>
                <h3 className="font-display text-lg font-bold mb-2">{ins.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{ins.body}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {law.diagnostic && (
        <section className="space-y-4">
          <h2 className="font-display text-3xl font-bold">AAC Diagnostic</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
              <div className="eyebrow text-emerald-400 mb-2">Working</div>
              <ul className="space-y-1.5 text-sm">
                {law.diagnostic.working.map((w, i) => <li key={i}>✓ {w}</li>)}
              </ul>
            </div>
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
              <div className="eyebrow text-destructive mb-2">Gaps</div>
              <ul className="space-y-1.5 text-sm">
                {law.diagnostic.gaps.map((g, i) => <li key={i}>△ {g}</li>)}
              </ul>
            </div>
          </div>
          {law.diagnostic.hardTruth && (
            <div className="rounded-xl border border-accent/40 bg-accent/5 p-5">
              <div className="eyebrow mb-2">Hard truth</div>
              <p className="font-serif-italic text-foreground leading-relaxed">{law.diagnostic.hardTruth}</p>
            </div>
          )}
        </section>
      )}

      {law.coaching && (
        <section className="space-y-4">
          <h2 className="font-display text-3xl font-bold">Coaching · {law.coaching.coach}</h2>
          <p className="text-muted-foreground">{law.coaching.intro}</p>
          <div className="grid gap-4">
            {law.coaching.strategies.map((s, i) => (
              <div key={i} className="rounded-xl border border-border/60 bg-card p-5">
                <h3 className="font-display text-lg font-bold">{s.name}</h3>
                <div className="eyebrow mt-1">{s.concept}</div>
                <p className="text-sm text-muted-foreground leading-relaxed mt-3">{s.body}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {law.metrics && law.metrics.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-3xl font-bold">Metrics</h2>
          <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr className="text-left">
                  <th className="px-4 py-3 eyebrow">Metric</th>
                  <th className="px-4 py-3 eyebrow">Goal</th>
                  <th className="px-4 py-3 eyebrow">Current</th>
                </tr>
              </thead>
              <tbody>
                {law.metrics.map((m, i) => (
                  <tr key={i} className="border-t border-border/40">
                    <td className="px-4 py-3">{m.metric}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.goal}</td>
                    <td className="px-4 py-3 font-mono text-xs">{m.current}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {law.pullQuote && (
        <blockquote className="text-center py-8">
          <p className="font-serif-italic text-2xl gradient-gold-text">"{law.pullQuote}"</p>
          {law.pullAttr && <footer className="eyebrow mt-3">— {law.pullAttr}</footer>}
        </blockquote>
      )}

      {(!law.insights || law.insights.length === 0) && !law.diagnostic && (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
          <p className="font-serif-italic">Detailed teaching content for this law is still being extracted from the audio session.</p>
        </div>
      )}

      {status === "pending" && (
        <section className="rounded-2xl border border-border/60 bg-gradient-to-br from-card to-background p-8 shadow-card relative overflow-hidden">
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
          <div className="relative space-y-5">
            <div className="eyebrow text-accent">→ READY TO BEGIN?</div>
            <h2 className="font-display text-3xl md:text-4xl font-black">Start AAC work on this Law</h2>
            <p className="font-serif-italic text-muted-foreground max-w-2xl leading-relaxed">
              Listen to Chip's session above. Then schedule a time with Claude to work through the AAC
              diagnostic for <span className="text-accent font-semibold not-italic">this</span> law specifically — your gaps,
              your action steps, your metrics. Rooted in AAC's context, not generic advice.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {[
                "Listen to the session above",
                "Schedule diagnostic interview with Claude",
                "Define AAC-specific action steps",
                "Begin executing — actions appear here and in the Action Plan tab",
              ].map((step, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 px-4 py-3"
                >
                  <span className="rounded-md border border-accent/40 bg-accent/10 px-2 py-1 font-mono text-[10px] text-accent shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm text-foreground">{step}</span>
                </div>
              ))}
            </div>

            <div className="pt-3">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 font-mono text-[11px] tracking-wider text-accent-foreground font-bold shadow-[0_0_30px_hsl(var(--accent)/0.4)] hover:scale-[1.02] transition"
              >
                <Sparkles className="h-4 w-4" />
                BEGIN AAC WORK ON THIS LAW
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
