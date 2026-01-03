import { Plus, Settings, Home, CalendarDays, IndianRupee, FileText, Link as LinkIcon, LogOut, User, Phone, Shield, Cog } from "lucide-react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import acstiLogo from "@/assets/acsti-logo.png";

interface AppSidebarProps {
  onAddBooking?: () => void;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  mobile?: string | null;
  photo?: string | null;
}

export function AppSidebar({ onAddBooking }: AppSidebarProps) {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const isCollapsed = state === "collapsed";
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { canAccessPage, isAdmin } = usePermissions();

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const user = await res.json();
          setUserProfile(user);
        }
      } catch { }
    };
    init();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      toast.success("Logged out successfully");
      navigate("/auth");
    } catch (error) {
      toast.error("Failed to log out");
      console.error(error);
    }
  };

  // Define all menu items with their required permissions
  const allMenuItems = [
    { title: "Dashboard", url: "/", icon: Home, permission: "dashboard" },
    { title: "Manage Bookings", url: "/manage-bookings", icon: CalendarDays, permission: "bookings" },
    { title: "Financial Track", url: "/financial-track", icon: IndianRupee, permission: "programs" },
    { title: "Report Generation", url: "/report-generation", icon: FileText, permission: "reports" },
    { title: "Booking Links", url: "/booking-links", icon: LinkIcon, permission: "booking-links" },
  ];

  // Filter menu items based on user permissions
  const menuItems = allMenuItems.filter(item => canAccessPage(item.permission));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border pb-4">
        <div className="flex items-center gap-3 px-2">
          <img
            src={acstiLogo}
            alt="ACSTI Logo"
            className={`object-contain transition-all ${isCollapsed ? 'h-8 w-8' : 'h-12 w-12'}`}
          />
          {!isCollapsed && (
            <span className="text-sm font-semibold text-sidebar-foreground whitespace-nowrap">ACSTI KERALA</span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2 py-2">
              <Button
                onClick={onAddBooking}
                className="w-full justify-start gap-2 bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground"
                size={isCollapsed ? "icon" : "default"}
              >
                <Plus className="h-4 w-4" />
                {!isCollapsed && <span>Add Booking</span>}
              </Button>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    tooltip={isCollapsed ? item.title : undefined}
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {isAdmin && canAccessPage("settings") && (
                <SidebarMenuItem key="Settings">
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === "/settings"}
                    tooltip={isCollapsed ? "Settings" : undefined}
                  >
                    <Link to="/settings">
                      <Cog className="h-4 w-4" />
                      {!isCollapsed && <span>Settings</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/50 bg-sidebar/50 backdrop-blur-sm">
        {userProfile && (
          <div className="p-2">
            {isCollapsed ? (
              <div className="space-y-2">
                <div className="flex justify-center p-2">
                  <Avatar className="h-9 w-9 border-2 border-primary/50 shadow-md">
                    <AvatarImage src={userProfile.photo || undefined} alt={userProfile.name} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-semibold text-sm">
                      {userProfile.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="px-1">
                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    className="w-full justify-center hover:bg-red-500/10 hover:text-red-500 transition-colors"
                    size="icon"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Profile Section - Clean Design */}
                <div className="p-3 rounded-lg border border-sidebar-border/50 bg-sidebar-accent/30">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-11 w-11 border-2 border-primary/30 shadow-sm">
                        <AvatarImage src={userProfile.photo || undefined} alt={userProfile.name} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-semibold">
                          {userProfile.name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-400 rounded-full border-2 border-sidebar shadow-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-sidebar-foreground truncate">
                        {userProfile.name}
                      </p>
                      <p className="text-xs text-sidebar-foreground/60 truncate">
                        {userProfile.email}
                      </p>
                      {userProfile.mobile && (
                        <p className="text-[11px] text-sidebar-foreground/50 truncate flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3" />
                          {userProfile.mobile}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-sidebar-border/30">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-md ${userProfile.role === 'admin'
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                      }`}>
                      <Shield className="h-3 w-3" />
                      {userProfile.role === 'admin' ? 'Administrator' : 'User'}
                    </span>
                  </div>
                </div>

                {/* Logout Button - Separate */}
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="w-full justify-start gap-2 hover:bg-red-500/10 hover:text-red-500 transition-colors h-9"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="font-medium text-sm">Sign Out</span>
                </Button>
              </div>
            )}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
