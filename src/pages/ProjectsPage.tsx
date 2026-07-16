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
import { Plus, Trash2, GripVertical, ArrowLeft, FolderKanban } from "lucide-react";

type Status = "backlog" | "todo" | "in_progress" | "review" | "done";

interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: Status;
  createdAt: number;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
}

const COLUMNS: { id: Status; label: string; accent: string }[] = [
  { id: "backlog", label: "Backlog", accent: "bg-muted-foreground/60" },
  { id: "todo", label: "To Do", accent: "bg-primary/70" },
  { id: "in_progress", label: "In Progress", accent: "bg-accent" },
  { id: "review", label: "Review", accent: "bg-secondary" },
  { id: "done", label: "Done", accent: "bg-emerald-500" },
];

const PROJECTS_KEY = "aac-projects-v2";
const TASKS_KEY = "aac-project-tasks-v1";

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

const ProjectsPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // Project dialog
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  // Task dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Status>("backlog");
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<Status | null>(null);

  useEffect(() => {
    setProjects(loadJSON<Project[]>(PROJECTS_KEY, []));
    setTasks(loadJSON<Task[]>(TASKS_KEY, []));
  }, []);

  useEffect(() => {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? null,
    [projects, activeProjectId],
  );

  const projectTasks = useMemo(
    () => tasks.filter((t) => t.projectId === activeProjectId),
    [tasks, activeProjectId],
  );

  const grouped = useMemo(() => {
    const map: Record<Status, Project[]> = {
      backlog: [], todo: [], in_progress: [], review: [], done: [],
    } as unknown as Record<Status, Task[]>;
    const m = map as unknown as Record<Status, Task[]>;
    for (const t of projectTasks) m[t.status].push(t);
    return m;
  }, [projectTasks]);

  // ---- Project CRUD ----
  const openNewProject = () => {
    setEditingProject(null);
    setProjectName("");
    setProjectDescription("");
    setProjectDialogOpen(true);
  };

  const openEditProject = (p: Project) => {
    setEditingProject(p);
    setProjectName(p.name);
    setProjectDescription(p.description ?? "");
    setProjectDialogOpen(true);
  };

  const saveProject = () => {
    if (!projectName.trim()) return;
    if (editingProject) {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === editingProject.id
            ? { ...p, name: projectName.trim(), description: projectDescription }
            : p,
        ),
      );
    } else {
      const p: Project = {
        id: crypto.randomUUID(),
        name: projectName.trim(),
        description: projectDescription,
        createdAt: Date.now(),
      };
      setProjects((prev) => [...prev, p]);
    }
    setProjectDialogOpen(false);
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setTasks((prev) => prev.filter((t) => t.projectId !== id));
    if (activeProjectId === id) setActiveProjectId(null);
  };

  // ---- Task CRUD ----
  const openNew = (col?: Status) => {
    setEditing(null);
    setTitle("");
    setDescription("");
    setStatus(col ?? "backlog");
    setDialogOpen(true);
  };

  const openEdit = (t: Task) => {
    setEditing(t);
    setTitle(t.title);
    setDescription(t.description ?? "");
    setStatus(t.status);
    setDialogOpen(true);
  };

  const save = () => {
    if (!title.trim() || !activeProjectId) return;
    if (editing) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editing.id ? { ...t, title: title.trim(), description, status } : t,
        ),
      );
    } else {
      const t: Task = {
        id: crypto.randomUUID(),
        projectId: activeProjectId,
        title: title.trim(),
        description,
        status,
        createdAt: Date.now(),
      };
      setTasks((prev) => [...prev, t]);
    }
    setDialogOpen(false);
  };

  const remove = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const onDrop = (col: Status) => {
    if (!dragId) return;
    setTasks((prev) =>
      prev.map((t) => (t.id === dragId ? { ...t, status: col } : t)),
    );
    setDragId(null);
    setDragOverCol(null);
  };

  // ============ PROJECT LIST VIEW ============
  if (!activeProject) {
    return (
      <div className="min-h-screen bg-background flex">
        <DashboardSidebar />
        <main className="flex-1 ml-[72px] p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">Projects</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Create a project, then track its tasks on a Kanban board.
              </p>
            </div>
            <Button onClick={openNewProject} className="rounded-xl">
              <Plus className="w-4 h-4 mr-1" />
              New Project
            </Button>
          </div>

          {projects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-12 text-center">
              <FolderKanban className="w-10 h-10 mx-auto text-muted-foreground/60 mb-3" />
              <h3 className="font-display font-semibold text-foreground">No projects yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first project to start tracking tasks.
              </p>
              <Button onClick={openNewProject} className="mt-4 rounded-xl">
                <Plus className="w-4 h-4 mr-1" />
                New Project
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((p) => {
                const count = tasks.filter((t) => t.projectId === p.id).length;
                const done = tasks.filter(
                  (t) => t.projectId === p.id && t.status === "done",
                ).length;
                return (
                  <div
                    key={p.id}
                    onClick={() => setActiveProjectId(p.id)}
                    className="group cursor-pointer rounded-2xl bg-card border border-border/60 p-5 shadow-sm hover:shadow-md hover:border-primary/40 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <FolderKanban className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-display font-semibold text-foreground truncate">
                            {p.name}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {done}/{count} tasks done
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditProject(p);
                          }}
                          className="text-muted-foreground hover:text-foreground text-xs px-2 py-1 rounded-md hover:bg-muted"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete project "${p.name}" and all its tasks?`)) {
                              deleteProject(p.id);
                            }
                          }}
                          className="text-muted-foreground hover:text-destructive p-1 rounded-md hover:bg-muted"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {p.description && (
                      <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                        {p.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>

        <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingProject ? "Edit Project" : "New Project"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Name</label>
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Project name"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <Textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="What's this project about?"
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setProjectDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveProject}>{editingProject ? "Save" : "Create"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ============ PROJECT BOARD VIEW ============
  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <main className="flex-1 ml-[72px] p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button
              onClick={() => setActiveProjectId(null)}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-1"
            >
              <ArrowLeft className="w-3 h-3" />
              All Projects
            </button>
            <h1 className="font-display text-2xl font-bold text-foreground">
              {activeProject.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {activeProject.description || "Drag cards between columns to update status."}
            </p>
          </div>
          <Button onClick={() => openNew()} className="rounded-xl">
            <Plus className="w-4 h-4 mr-1" />
            New Task
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
                    title="Add task"
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
                  {items.map((t) => (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={() => setDragId(t.id)}
                      onDragEnd={() => {
                        setDragId(null);
                        setDragOverCol(null);
                      }}
                      onClick={() => openEdit(t)}
                      className={`group cursor-grab active:cursor-grabbing rounded-xl bg-background border border-border/60 p-3 shadow-sm hover:shadow-md hover:border-primary/40 transition-all ${
                        dragId === t.id ? "opacity-50" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground/40 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-foreground truncate">
                            {t.title}
                          </div>
                          {t.description && (
                            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {t.description}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            remove(t.id);
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
            <DialogTitle>{editing ? "Edit Task" : "New Task"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this task about?"
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