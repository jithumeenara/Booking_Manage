import { useLocation, useNavigate } from "react-router-dom";
import { Home, Calendar, IndianRupee, FileText, Link2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  adminOnly?: boolean;
}

interface MobileBottomNavProps {
  userRole?: string;
}

export const MobileBottomNav = ({ userRole }: MobileBottomNavProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems: NavItem[] = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Calendar, label: "Bookings", path: "/manage-bookings" },
    { icon: IndianRupee, label: "Finance", path: "/financial-track" },
    { icon: FileText, label: "Reports", path: "/report-generation" },
    { icon: Link2, label: "Links", path: "/booking-links" },
    { icon: Settings, label: "Settings", path: "/settings", adminOnly: true },
  ];

  // Filter items based on user role
  const filteredItems = navItems.filter(item => 
    !item.adminOnly || userRole === 'admin'
  );

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg">
      <div className="grid grid-cols-5 gap-1 px-2 py-2">
        {filteredItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all duration-200",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5 mb-1", active && "scale-110")} />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
