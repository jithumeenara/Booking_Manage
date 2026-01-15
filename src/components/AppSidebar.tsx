import { Plus, Home, CalendarDays, IndianRupee, FileText, Link as LinkIcon, LogOut, Phone, Shield, Cog, UserPen, Building } from "lucide-react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { usePermissions, User, clearPermissionsCache } from "@/hooks/usePermissions";
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

import { toast } from "sonner";
import acstiLogo from "@/assets/acsti-logo.png";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AppSidebarProps {
  readonly onAddBooking?: () => void;
}



export function AppSidebar({ onAddBooking }: AppSidebarProps) {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const isCollapsed = state === "collapsed";
  const { canAccessPage, isAdmin, user } = usePermissions();
  const userProfile: User | null = user;
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    mobile: "",
    photo: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [isSaving, setIsSaving] = useState(false);



  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      clearPermissionsCache();
      toast.success("Logged out successfully");
      navigate("/auth");
    } catch (error) {
      toast.error("Failed to log out");
      console.error(error);
    }
  };

  const handleEditProfile = () => {
    if (userProfile) {
      setEditForm({
        name: userProfile.name,
        email: userProfile.email,
        mobile: userProfile.mobile || "",
        photo: userProfile.photo || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      setShowEditDialog(true);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!userProfile) return;

    // Validate password if user wants to change it
    if (editForm.newPassword || editForm.confirmPassword) {
      if (!editForm.currentPassword) {
        toast.error("Please enter your current password");
        return;
      }
      if (editForm.newPassword !== editForm.confirmPassword) {
        toast.error("New passwords do not match");
        return;
      }
      if (editForm.newPassword.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }
    }

    setIsSaving(true);
    try {
      // Update basic profile info including photo
      const profileRes = await fetch(`/api/users/${userProfile.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: editForm.name,
          email: editForm.email,
          mobile: editForm.mobile || null,
          photo: editForm.photo
        })
      });

      if (!profileRes.ok) {
        const error = await profileRes.json();
        toast.error(error.error || "Failed to update profile");
        setIsSaving(false);
        return;
      }

      // Update password if provided
      if (editForm.newPassword) {
        const passwordRes = await fetch(`/api/users/${userProfile.id}/password`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            currentPassword: editForm.currentPassword,
            newPassword: editForm.newPassword
          })
        });

        if (!passwordRes.ok) {
          const error = await passwordRes.json();
          toast.error(error.error || "Failed to update password");
          setIsSaving(false);
          return;
        }
      }

      toast.success("Profile updated successfully");

      // Refresh page to reload profile data across app
      window.location.reload();

      setShowEditDialog(false);
    } catch (error) {
      toast.error("Failed to update profile");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  // Define all menu items with their required permissions
  const allMenuItems = [
    { title: "Dashboard", url: "/", icon: Home, permission: "dashboard" },
    { title: "Manage Bookings", url: "/manage-bookings", icon: CalendarDays, permission: "bookings" },
    { title: "Financial Track", url: "/financial-track", icon: IndianRupee, permission: "programs" },
    { title: "Report Generation", url: "/report-generation", icon: FileText, permission: "reports" },
    { title: "Booking Links", url: "/booking-links", icon: LinkIcon, permission: "booking-links" },
    { title: "Training Halls", url: "/training-halls", icon: Building, permission: "view-training-halls" }, // Updated permission
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
        {canAccessPage("add-booking") && (
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
        )}

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
                    <button
                      onClick={handleEditProfile}
                      className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center hover:bg-sidebar-accent/50 transition-colors"
                      title="Edit Profile"
                    >
                      <UserPen className="h-4 w-4 text-sidebar-foreground/60 hover:text-primary" />
                    </button>
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

      {/* Edit Profile Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information and change your password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto px-1">
            <div className="flex justify-center mb-4">
              <div className="relative group cursor-pointer">
                <Avatar className="h-24 w-24 border-4 border-muted">
                  <AvatarImage src={editForm.photo} />
                  <AvatarFallback className="text-2xl">
                    {editForm.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <UserPen className="h-8 w-8 text-white" />
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handlePhotoChange}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="your.email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile</Label>
              <Input
                id="mobile"
                value={editForm.mobile}
                onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                placeholder="Mobile number"
              />
            </div>
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-3">Change Password (Optional)</p>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={editForm.currentPassword}
                    onChange={(e) => setEditForm({ ...editForm, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={editForm.newPassword}
                    onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={editForm.confirmPassword}
                    onChange={(e) => setEditForm({ ...editForm, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}
