import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CheckSquare, Square, Trash2, ListTodo } from "lucide-react";

type Filter = "open" | "overdue" | "done" | "all";

interface Props {
  members: any[];
  onSelectPerson?: (m: any) => void;
}

export function useActionSteps() {
  return useQuery({
    queryKey: ["action_steps", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("member_action_steps" as any)
        .select("id, member_id, title, due_date, status, completed_at, created_at")
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any[]) || [];
    },
  });
}

export default function ActionStepsBoard({ members, onSelectPerson }: Props) {
  const qc = useQueryClient();
  const { data: steps = [] } = useActionSteps();
  const [filter, setFilter] = useState<Filter>("open");

  const memberById = useMemo(() => {
    const m = new Map<string, any>();
    members.forEach((x) => m.set(x.id, x));
    return m;
  }, [members]);

  const todayStr = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    return (steps as any[]).filter((s) => {
      if (filter === "all") return true;
      if (filter === "done") return s.status === "done";
      if (filter === "overdue") return s.status !== "done" && s.due_date && s.due_date < todayStr;
      return s.status !== "done";
    });
  }, [steps, filter, todayStr]);

  const counts = useMemo(() => ({
    open: (steps as any[]).filter((s) => s.status !== "done").length,
    overdue: (steps as any[]).filter((s) => s.status !== "done" && s.due_date && s.due_date < todayStr).length,
    done: (steps as any[]).filter((s) => s.status === "done").length,
    all: steps.length,
  }), [steps, todayStr]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["action_steps", "all"] });
    qc.invalidateQueries({ queryKey: ["member_action_steps"] });
  };

  const toggleStep = useMutation({
    mutationFn: async (s: any) => {
      const done = s.status === "done";
      const { error } = await supabase
        .from("member_action_steps" as any)
        .update({ status: done ? "open" : "done", completed_at: done ? null : new Date().toISOString() } as any)
        .eq("id", s.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteStep = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("member_action_steps" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "open", label: `Open · ${counts.open}` },
    { key: "overdue", label: `Overdue · ${counts.overdue}` },
    { key: "done", label: `Done · ${counts.done}` },
    { key: "all", label: `All · ${counts.all}` },
  ];

  return (
    <section>
      <div className="eyebrow mb-3">— Act on it</div>
      <h3 className="font-display text-3xl font-bold mb-2 flex items-center gap-2">
        <ListTodo className="h-6 w-6 text-accent" />
        Action <em className="font-serif-italic gradient-gold-text font-semibold not-italic-mark">steps</em>
      </h3>
      <p className="text-sm text-muted-foreground mb-5">
        Every step you've logged on a person's profile, consolidated here.
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wider transition ${
              filter === f.key
                ? "border-accent bg-accent/15 text-accent"
                : "border-border/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border/60 bg-card/40 divide-y divide-border/50">
        {filtered.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground italic">Nothing here right now.</p>
        )}
        {filtered.map((s: any) => {
          const m = memberById.get(s.member_id);
          const done = s.status === "done";
          const overdue = !done && s.due_date && s.due_date < todayStr;
          return (
            <div key={s.id} className={`group flex items-center gap-3 p-3 ${done ? "opacity-50" : ""}`}>
              <button onClick={() => toggleStep.mutate(s)} className="text-accent shrink-0">
                {done ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4 text-muted-foreground" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${done ? "line-through" : ""}`}>{s.title}</div>
                <button
                  onClick={() => m && onSelectPerson?.(m)}
                  className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-accent transition"
                >
                  {m ? `${m.first_name} ${m.last_name}` : "Unknown person"}
                </button>
              </div>
              {s.due_date && (
                <span className={`font-mono text-[10px] uppercase tracking-wider shrink-0 ${overdue ? "text-destructive" : "text-muted-foreground"}`}>
                  due {new Date(s.due_date + "T12:00:00").toLocaleDateString()}
                </span>
              )}
              <button
                onClick={() => deleteStep.mutate(s.id)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded text-destructive hover:bg-destructive/20 transition shrink-0"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
