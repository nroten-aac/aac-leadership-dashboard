import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Bell, Download, Printer } from "lucide-react";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const captureDashboard = async (): Promise<HTMLCanvasElement | null> => {
  const el = document.getElementById("dashboard-content");
  if (!el) return null;
  const header = el.querySelector("[data-dashboard-header]") as HTMLElement | null;
  if (header) header.style.display = "none";
  try {
    return await html2canvas(el, {
      backgroundColor: getComputedStyle(document.documentElement).getPropertyValue("--background")
        ? `hsl(${getComputedStyle(document.documentElement).getPropertyValue("--background").trim()})`
        : "#ffffff",
      scale: 2,
      useCORS: true,
      logging: false,
      allowTaint: true,
      foreignObjectRendering: false,
      removeContainer: true,
    });
  } finally {
    if (header) header.style.display = "";
  }
};

const handleDownload = async () => {
  toast.info("Preparing download...");
  const canvas = await captureDashboard();
  if (!canvas) return;
  const link = document.createElement("a");
  link.download = `dashboard-${new Date().toISOString().slice(0, 10)}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
  toast.success("Dashboard downloaded!");
};

const handlePrint = async () => {
  toast.info("Preparing print...");
  const el = document.getElementById("dashboard-content");
  if (!el) return;

  // Find the element with data-print-break-after and calculate the split point
  const breakEl = el.querySelector("[data-print-break-after]") as HTMLElement | null;
  const breakY = breakEl
    ? (breakEl.offsetTop + breakEl.offsetHeight - el.offsetTop) * 2 // scale=2
    : null;

  const canvas = await captureDashboard();
  if (!canvas) return;

  const pages: string[] = [];

  if (breakY && breakY < canvas.height) {
    // Page 1: top to breakY
    const c1 = document.createElement("canvas");
    c1.width = canvas.width;
    c1.height = breakY;
    c1.getContext("2d")!.drawImage(canvas, 0, 0, canvas.width, breakY, 0, 0, canvas.width, breakY);
    pages.push(c1.toDataURL("image/png"));

    // Page 2: breakY to bottom
    const c2 = document.createElement("canvas");
    c2.width = canvas.width;
    c2.height = canvas.height - breakY;
    c2.getContext("2d")!.drawImage(canvas, 0, breakY, canvas.width, canvas.height - breakY, 0, 0, canvas.width, canvas.height - breakY);
    pages.push(c2.toDataURL("image/png"));
  } else {
    pages.push(canvas.toDataURL("image/png"));
  }

  const isSinglePage = pages.length === 1;
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`
    <html><head><title>Dashboard</title><style>
      * { margin: 0; padding: 0; }
      html, body { width: 100%; height: 100%; }
      img { display: block; }
      .page-break { page-break-after: always; break-after: page; }
      ${isSinglePage ? `
        img { width: 100%; height: auto; max-height: 100vh; object-fit: contain; }
      ` : `
        img { width: 100%; height: auto; }
      `}
      @media print {
        @page { margin: 0; size: auto; }
        body { margin: 0; }
        ${isSinglePage ? `
          img { width: 100vw; max-height: 100vh; object-fit: contain; }
        ` : `
          img { width: 100vw; }
        `}
      }
    </style></head><body>
      ${pages.map((src, i) =>
        `<div class="${i < pages.length - 1 ? 'page-break' : ''}"><img src="${src}" /></div>`
      ).join("")}
      <script>
        var imgs = document.querySelectorAll("img");
        var loaded = 0;
        imgs.forEach(function(img) {
          img.onload = function() { loaded++; if (loaded === imgs.length) { window.print(); window.close(); } };
          if (img.complete) { loaded++; if (loaded === imgs.length) { window.print(); window.close(); } }
        });
      </script>
    </body></html>
  `);
  win.document.close();
};

const DashboardHeader = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);

  const handleSyncNow = async () => {
    setSyncing(true);
    toast.info("Syncing from Planning Center...");
    try {
      const [att, giv] = await Promise.all([
        supabase.functions.invoke("import-pco-attendance", { body: { weeks: 4 } }),
        supabase.functions.invoke("import-pco-giving", { body: { months: 3 } }),
      ]);
      const errs: string[] = [];
      if (att.error) errs.push(`Attendance: ${att.error.message ?? att.error}`);
      if (giv.error) errs.push(`Giving: ${giv.error.message ?? giv.error}`);
      if (errs.length === 2) throw new Error(errs.join(" | "));
      if (errs.length === 1) toast.warning(`Partial sync — ${errs[0]}`);
      else toast.success("Sync complete");
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["monthly_giving"] });
      queryClient.invalidateQueries({ queryKey: ["donations"] });
    } catch (e: any) {
      toast.error(`Sync failed: ${e.message ?? e}`);
    } finally {
      setSyncing(false);
    }
  };

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const displayName = profile?.display_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <header data-dashboard-header className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">
          {greeting}, {displayName}!
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Explore your church data and activity
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={handleSyncNow}
          disabled={syncing}
          className="h-10 px-4 rounded-xl bg-card shadow-card flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-60"
          title="Sync from Planning Center"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">{syncing ? "Syncing..." : "Sync Now"}</span>
        </button>
        <button
          onClick={handleDownload}
          className="w-10 h-10 rounded-xl bg-card shadow-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          title="Download as image"
        >
          <Download className="h-5 w-5" />
        </button>
        <button
          onClick={handlePrint}
          className="w-10 h-10 rounded-xl bg-card shadow-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          title="Print dashboard"
        >
          <Printer className="h-5 w-5" />
        </button>
        <div className="hidden sm:flex items-center gap-2 bg-card rounded-xl px-4 py-2.5 shadow-card">
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Search...</span>
        </div>
        <button className="w-10 h-10 rounded-xl bg-card shadow-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
};

export default DashboardHeader;
