import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { LAWS } from "../seed";
import { LAW_SVGS } from "../illustrations";

export default function LawDetail() {
  const { n } = useParams<{ n: string }>();
  const law = LAWS.find((l) => l.n === n);

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
      <Link to="/members/playbook" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-accent transition">
        <ArrowLeft className="h-4 w-4" /> Back to Playbook
      </Link>

      <header className="space-y-4">
        <div className="eyebrow">— Law {law.n} · {law.duration}</div>
        <div className="flex items-start gap-6">
          <div className="h-16 w-16 text-accent shrink-0" dangerouslySetInnerHTML={{ __html: LAW_SVGS[law.n] || "" }} />
          <h1 className="font-display text-5xl md:text-6xl font-black leading-tight">
            The Law of <em className="font-serif-italic gradient-gold-text font-semibold not-italic-mark">{law.accent}</em>
          </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-3xl">{law.subtitle}</p>
      </header>

      {law.heroStat && (
        <section className="rounded-2xl border border-accent/30 bg-accent/5 p-8 text-center">
          <div className="font-display text-7xl font-black gradient-gold-text">{law.heroStat.number}</div>
          <div className="eyebrow mt-2">{law.heroStat.label}</div>
          <p className="font-serif-italic text-lg text-muted-foreground mt-3 max-w-2xl mx-auto">{law.heroStat.text}</p>
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
    </div>
  );
}
