import { LayoutDashboard, Users, Calendar, DollarSign, Settings, LogOut, ClipboardEdit, Shield } from "lucide-react";
import SheepIcon from "@/components/icons/SheepIcon";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/usePermissions";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "@/assets/dashboard-logo.png";

const DashboardSidebar = () => {
  const { signOut } = useAuth();
  const { isAdmin, allowedTabs } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();

  const allNavItems = [
    { icon: Users, label: "Shepherding", path: "/members", tabId: "members" },
    { icon: LayoutDashboard, label: "Summary Overview", path: "/", tabId: "dashboard" },
    { icon: DollarSign, label: "Giving", path: "/giving", tabId: "giving" },
    { icon: Calendar, label: "Projects", path: "/projects", tabId: "projects" },
    { icon: ClipboardEdit, label: "Data Entry", path: "/data-entry", tabId: "data-entry" },
  ];

  // Filter nav items based on permissions (admins see all)
  const navItems = isAdmin
    ? allNavItems
    : allNavItems.filter((item) => allowedTabs.includes(item.tabId as any));

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[72px] bg-card flex flex-col items-center py-6 z-40 shadow-soft">
      {/* Logo */}
      <div className="w-11 h-11 rounded-2xl overflow-hidden flex items-center justify-center mb-8 shadow-soft">
        <img src={logo} alt="AAC Leadership Dashboard" className="w-full h-full object-cover" />
      </div>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col items-center gap-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.label}
              title={item.label}
              onClick={() => navigate(item.path)}
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
            </button>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="flex flex-col items-center gap-1">
        {isAdmin && (
          <button
            title="Admin Panel"
            onClick={() => navigate("/admin")}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${
              location.pathname === "/admin"
                ? "bg-primary text-primary-foreground shadow-soft"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Shield className="h-5 w-5" />
          </button>
        )}
        <button
          title="Settings"
          onClick={() => navigate("/settings")}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${
            location.pathname === "/settings"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
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
