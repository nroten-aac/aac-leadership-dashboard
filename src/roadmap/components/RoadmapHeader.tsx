import { NavLink } from "react-router-dom";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

const TABS = [
  { id: "today", label: "Today", path: "/members" },
  { id: "dashboard", label: "Dashboard", path: "/members/dashboard" },
  { id: "playbook", label: "Playbook", path: "/members/playbook" },
  { id: "actions", label: "Action Plan", path: "/members/actions" },
  { id: "people", label: "People", path: "/members/people" },
];

export default function RoadmapHeader() {
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    toast.info("Syncing from Planning Center...");
    try {
      const [ppl, counts] = await Promise.all([
        supabase.functions.invoke("import-planning-center-people", { body: {} }),
        supabase.functions.invoke("fetch-pco-list-counts", { body: {} }),
      ]);
      const errs: string[] = [];
      if (ppl.error) errs.push(`People: ${ppl.error.message ?? ppl.error}`);
      if (counts.error) errs.push(`List counts: ${counts.error.message ?? counts.error}`);
      if (errs.length === 2) throw new Error(errs.join(" | "));
      if (errs.length) toast.warning(`Partial sync — ${errs.join(" | ")}`);
      else toast.success("Sync complete");
      ["members", "member_groups", "pcoListCounts", "pco-list-counts", "roadmap", "taggedMembers"].forEach((k) =>
        queryClient.invalidateQueries({ queryKey: [k] })
      );
    } catch (e: any) {
      toast.error(`Sync failed: ${e.message ?? e}`);
    } finally {
      setSyncing(false);
    }
  };

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
          <button
            onClick={handleSync}
            disabled={syncing}
            title="Sync from Planning Center"
            className="hidden sm:inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground hover:bg-card disabled:opacity-60"
          >
            {syncing ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <span className="h-2 w-2 rounded-full bg-secondary" />
            )}
            <span className="font-mono">{syncing ? "Syncing..." : "Sync from PCO"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
