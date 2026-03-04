import { LayoutDashboard, Users, Calendar, DollarSign, BookOpen, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.png";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Users, label: "Members" },
  { icon: Calendar, label: "Attendance" },
  { icon: DollarSign, label: "Giving" },
  { icon: BookOpen, label: "Discipleship" },
];

const DashboardSidebar = () => {
  const { signOut } = useAuth();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[72px] bg-card flex flex-col items-center py-6 z-40 shadow-soft">
      {/* Logo */}
      <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center mb-8">
        <img src={logo} alt="AAC" className="h-6 brightness-0 invert" />
      </div>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col items-center gap-1">
        {navItems.map((item) => (
          <button
            key={item.label}
            title={item.label}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${
              item.active
                ? "bg-primary text-primary-foreground shadow-soft"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <item.icon className="h-5 w-5" />
          </button>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="flex flex-col items-center gap-1">
        <button
          title="Settings"
          className="w-11 h-11 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
        >
          <Settings className="h-5 w-5" />
        </button>
        <button
          title="Sign out"
          onClick={signOut}
          className="w-11 h-11 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
