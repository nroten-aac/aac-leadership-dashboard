import { useAuth } from "@/hooks/useAuth";
import { Search, Bell, Download, Printer } from "lucide-react";
import html2canvas from "html2canvas";
import { toast } from "sonner";

const captureDashboard = async (): Promise<HTMLCanvasElement | null> => {
  const el = document.getElementById("dashboard-content");
  if (!el) return null;
  return html2canvas(el, {
    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue("--background")
      ? `hsl(${getComputedStyle(document.documentElement).getPropertyValue("--background").trim()})`
      : "#ffffff",
    scale: 2,
    useCORS: true,
  });
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
  const canvas = await captureDashboard();
  if (!canvas) return;
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`
    <html><head><title>Dashboard</title><style>
      body { margin: 0; display: flex; justify-content: center; }
      img { max-width: 100%; height: auto; }
      @media print { body { margin: 0; } }
    </style></head><body>
      <img src="${canvas.toDataURL("image/png")}" onload="window.print();window.close();" />
    </body></html>
  `);
  win.document.close();
};

const DashboardHeader = () => {
  const { user } = useAuth();

  const displayName = user?.email?.split("@")[0] ?? "there";
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <header className="flex items-center justify-between mb-8">
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
