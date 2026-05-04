import { NavLink } from "react-router-dom";

const TABS = [
  { id: "today", label: "Today", path: "/members" },
  { id: "dashboard", label: "Dashboard", path: "/members/dashboard" },
  { id: "playbook", label: "Playbook", path: "/members/playbook" },
  { id: "actions", label: "Action Plan", path: "/members/actions" },
  { id: "people", label: "People", path: "/members/people" },
];

export default function RoadmapHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground font-display font-black text-sm">
            AAC
          </div>
          <div>
            <div className="font-display text-sm font-bold tracking-tight text-foreground">HIGH IMPACT ROADMAP</div>
            <div className="eyebrow text-[10px]">Ashe Alliance · West Jefferson NC</div>
          </div>
        </div>

        <nav className="flex items-center gap-1 rounded-full border border-border/60 bg-card/60 p-1">
          {TABS.map((t) => (
            <NavLink key={t.id} to={t.path} end={t.path === "/members"}
              className={({ isActive }) =>
                `font-display text-xs font-semibold tracking-wide uppercase px-4 py-2 rounded-full transition-all ${
                  isActive
                    ? "bg-accent text-accent-foreground shadow-gold-glow"
                    : "text-muted-foreground hover:text-foreground"
                }`
              }>
              {t.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-secondary" />
            <span className="font-mono">Synced from PCO</span>
          </span>
        </div>
      </div>
    </header>
  );
}
