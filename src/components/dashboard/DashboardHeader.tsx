import logo from "@/assets/logo.png";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const DashboardHeader = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="gradient-primary px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Ashe Alliance Church" className="h-10 brightness-0 invert" />
          <div>
            <h1 className="text-lg font-display font-bold text-primary-foreground">
              Leadership Dashboard
            </h1>
            <p className="text-xs text-primary-foreground/70">Ashe Alliance Church</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-primary-foreground/80 hidden sm:block">
            {user?.email}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
