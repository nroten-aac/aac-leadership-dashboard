import { useAuth } from "@/hooks/useAuth";
import { Search, Bell } from "lucide-react";

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
