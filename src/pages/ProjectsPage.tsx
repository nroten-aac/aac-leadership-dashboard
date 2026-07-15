import { useEffect, useMemo, useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2, GripVertical } from "lucide-react";

type Status = "backlog" | "todo" | "in_progress" | "review" | "done";

interface Project {
  id: string;
  title: string;
  description?: string;
  status: Status;
  createdAt: number;
}

const COLUMNS: { id: Status; label: string; accent: string }[] = [
  { id: "backlog", label: "Backlog", accent: "bg-muted-foreground/60" },
  { id: "todo", label: "To Do", accent: "bg-primary/70" },
  { id: "in_progress", label: "In Progress", accent: "bg-accent" },
  { id: "review", label: "Review", accent: "bg-secondary" },
  { id: "done", label: "Done", accent: "bg-emerald-500" },
];

const STORAGE_KEY = "aac-projects-v1";

function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveProjects(projects: Project[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

const ProjectsPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Status>("backlog");
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<Status | null>(null);

  useEffect(() => {
    setProjects(loadProjects());
  }, []);

  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  const grouped = useMemo(() => {
    const map: Record<Status, Project[]> = {
      backlog: [], todo: [], in_progress: [], review: [], done: [],
    };
    for (const p of projects) map[p.status].push(p);
    return map;
  }, [projects]);

  const openNew = (col?: Status) => {
    setEditing(null);
    setTitle("");
    setDescription("");
    setStatus(col ?? "backlog");
    setDialogOpen(true);
  };

  const openEdit = (p: Project) => {
    setEditing(p);
    setTitle(p.title);
    setDescription(p.description ?? "");
    setStatus(p.status);
    setDialogOpen(true);
  };

  const save = () => {
    if (!title.trim()) return;
    if (editing) {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === editing.id ? { ...p, title: title.trim(), description, status } : p,
        ),
      );
    } else {
      const p: Project = {
        id: crypto.randomUUID(),
        title: title.trim(),
        description,
        status,
        createdAt: Date.now(),
      };
      setProjects((prev) => [...prev, p]);
    }
    setDialogOpen(false);
  };

  const remove = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const onDrop = (col: Status) => {
    if (!dragId) return;
    setProjects((prev) =>
      prev.map((p) => (p.id === dragId ? { ...p, status: col } : p)),
    );
    setDragId(null);
    setDragOverCol(null);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <main className="flex-1 ml-[72px] p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Projects</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track initiatives across stages — drag cards between columns.
            </p>
          </div>
          <Button onClick={() => openNew()} className="rounded-xl">
            <Plus className="w-4 h-4 mr-1" />
            New Project
          </Button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const items = grouped[col.id];
            const isOver = dragOverCol === col.id;
            return (
              <div
                key={col.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOverCol !== col.id) setDragOverCol(col.id);
                }}
                onDragLeave={() => setDragOverCol((c) => (c === col.id ? null : c))}
                onDrop={() => onDrop(col.id)}
                className={`w-[300px] shrink-0 rounded-2xl bg-card/60 border transition-colors ${
                  isOver ? "border-primary bg-primary/5" : "border-border/60"
                }`}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${col.accent}`} />
                    <h3 className="font-display font-semibold text-sm text-foreground">
                      {col.label}
                    </h3>
                    <span className="text-xs text-muted-foreground">({items.length})</span>
                  </div>
                  <button
                    onClick={() => openNew(col.id)}
                    className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted"
                    title="Add project"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 space-y-2 min-h-[200px]">
                  {items.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border/60 rounded-xl">
                      Drop here
                    </div>
                  )}
                  {items.map((p) => (
                    <div
                      key={p.id}
                      draggable
                      onDragStart={() => setDragId(p.id)}
                      onDragEnd={() => {
                        setDragId(null);
                        setDragOverCol(null);
                      }}
                      onClick={() => openEdit(p)}
                      className={`group cursor-grab active:cursor-grabbing rounded-xl bg-background border border-border/60 p-3 shadow-sm hover:shadow-md hover:border-primary/40 transition-all ${
                        dragId === p.id ? "opacity-50" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground/40 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-foreground truncate">
                            {p.title}
                          </div>
                          {p.description && (
                            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {p.description}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            remove(p.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Project" : "New Project"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Project title"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this project about?"
                rows={4}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
                className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {COLUMNS.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectsPage;