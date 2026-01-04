import { useState, useEffect } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Mail, Server, Key, Lock, Save, Users, Shield, Camera, UserCog, Settings as SettingsIcon, Send, Calendar, DollarSign, FileText, UserPlus, User, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function Settings() {
  const { user: currentUser } = usePermissions();
  const [activeTab, setActiveTab] = useState("email");
  // ... existing state ...

  // Delete user state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [emailConfig, setEmailConfig] = useState({
    smtp_host: "",
    smtp_port: "587",
    smtp_user: "",
    smtp_password: "",
    from_email: "",
    from_name: "ACSTI Kerala",
    security: "tls"
  });
  const [toEmail, setToEmail] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [showComprehensiveEditDialog, setShowComprehensiveEditDialog] = useState(false);
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    role: "",
    password: "",
    photo: ""
  });
  const [createUserData, setCreateUserData] = useState({
    name: "",
    email: "",
    mobile: "",
    role: "user",
    password: "",
    photo: ""
  });
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [telegramConfig, setTelegramConfig] = useState({
    bot_token: "",
    chat_id: "",
    enabled: false,
    notify_on_link_booking: true,
    notify_on_billing_ready: true,
    notify_on_month_end: true,
    notify_on_login: false
  });
  const [isSavingTelegram, setIsSavingTelegram] = useState(false);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [isSendingUpcoming, setIsSendingUpcoming] = useState(false);
  const [isSendingPendingBills, setIsSendingPendingBills] = useState(false);
  const [isSendingReadyBilling, setIsSendingReadyBilling] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [selectedUserPermissions, setSelectedUserPermissions] = useState<any[]>([]);
  const [adminCount, setAdminCount] = useState(0);
  const AVAILABLE_PAGES = ['dashboard', 'bookings', 'programs', 'booking-links', 'reports', 'settings', 'user-management'];

  useEffect(() => {
    loadEmailConfig();
    loadUsers();
    loadTelegramConfig();
  }, []);

  const loadEmailConfig = async () => {
    try {
      const res = await fetch('/api/email-config', { credentials: 'include' });
      const text = await res.text();

      try {
        const data = text ? JSON.parse(text) : null;
        if (res.ok && data) {
          setEmailConfig(data);
        } else if (!res.ok) {
          console.error('Failed to load email config:', data?.error || text || res.statusText);
        }
      } catch (e) {
        console.error('Failed to parse email config response:', text);
      }
    } catch (error) {
      console.error('Failed to load email config:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/users', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
        // Count admins
        const admins = data.filter((u: any) => u.role === 'admin').length;
        setAdminCount(admins);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadTelegramConfig = async () => {
    try {
      const res = await fetch('/api/telegram-config', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setTelegramConfig(prev => ({ ...prev, ...data }));
        }
      }
    } catch (error) {
      console.error('Failed to load Telegram config:', error);
    }
  };

  const handleSaveTelegramConfig = async () => {
    if (!telegramConfig.bot_token || !telegramConfig.chat_id) {
      toast.error('Bot token and chat ID are required');
      return;
    }
    setIsSavingTelegram(true);
    try {
      const res = await fetch('/api/telegram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(telegramConfig),
      });
      if (res.ok) {
        toast.success('Telegram configuration saved successfully');
      } else {
        const data = await res.json();
        const errorMsg = data.details ? `${data.error}: ${data.details}` : (data.error || 'Failed to save configuration');
        toast.error(errorMsg);
        console.error('Backend error:', data);
      }
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error('Failed to save configuration: ' + (error.message || 'Network error'));
    } finally {
      setIsSavingTelegram(false);
    }
  };

  const handleTestTelegram = async () => {
    if (!telegramConfig.bot_token || !telegramConfig.chat_id) {
      toast.error('Please enter bot token and chat ID first');
      return;
    }
    setIsTestingTelegram(true);
    try {
      const res = await fetch('/api/telegram-config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          bot_token: telegramConfig.bot_token,
          chat_id: telegramConfig.chat_id
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Test message sent successfully!');
      } else {
        toast.error(data.error || 'Test failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send test message');
    } finally {
      setIsTestingTelegram(false);
    }
  };

  const handleSendUpcoming = async () => {
    setIsSendingUpcoming(true);
    try {
      const res = await fetch('/api/telegram/send-upcoming', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Successfully sent ${data.count} upcoming programmes to Telegram`);
      } else {
        const errorMsg = data.details ? `${data.error}: ${data.details}` : data.error;
        toast.error(errorMsg || 'Failed to send upcoming programmes');
      }
    } catch (error: any) {
      console.error('Error sending upcoming programmes:', error);
      toast.error(error.message || 'Failed to send upcoming programmes');
    } finally {
      setIsSendingUpcoming(false);
    }
  };

  const handleSendPendingBills = async () => {
    setIsSendingPendingBills(true);
    try {
      const res = await fetch('/api/telegram/send-pending-bills', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Successfully sent ${data.count} pending bills to Telegram`);
      } else {
        const errorMsg = data.details ? `${data.error}: ${data.details}` : data.error;
        toast.error(errorMsg || 'Failed to send pending bills');
      }
    } catch (error: any) {
      console.error('Error sending pending bills:', error);
      toast.error(error.message || 'Failed to send pending bills');
    } finally {
      setIsSendingPendingBills(false);
    }
  };

  const handleSendReadyBilling = async () => {
    setIsSendingReadyBilling(true);
    try {
      const res = await fetch('/api/telegram/send-ready-billing', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Successfully sent ${data.count} bookings ready for billing to Telegram`);
      } else {
        const errorMsg = data.details ? `${data.error}: ${data.details}` : data.error;
        toast.error(errorMsg || 'Failed to send ready for billing');
      }
    } catch (error: any) {
      console.error('Error sending ready for billing:', error);
      toast.error(error.message || 'Failed to send ready for billing');
    } finally {
      setIsSendingReadyBilling(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/email-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(emailConfig),
      });

      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (e) {
        throw new Error(`Server returned invalid response: ${text.slice(0, 100)}...`);
      }

      if (!res.ok) {
        throw new Error(data?.error || `Failed to save: ${res.status} ${res.statusText}`);
      }

      toast.success("Email configuration saved successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save email configuration");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateRole = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${selectedUser.id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        toast.success('Role updated successfully');
        setShowEditDialog(false);
        loadUsers();
      }
    } catch (error) {
      toast.error('Failed to update role');
    } finally {
      setSaving(false);
    }
  };

  const updatePassword = async () => {
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${selectedUser.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ newPassword }),
      });
      if (res.ok) {
        toast.success('Password reset successfully');
        setShowPasswordDialog(false);
        setNewPassword('');
      }
    } catch (error) {
      toast.error('Failed to reset password');
    } finally {
      setSaving(false);
    }
  };

  const updatePhoto = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${selectedUser.id}/photo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ photo: photoUrl }),
      });
      if (res.ok) {
        toast.success('Photo updated successfully');
        setShowPhotoDialog(false);
        setPhotoUrl('');
        loadUsers();
      }
    } catch (error) {
      toast.error('Failed to update photo');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoUrl(String(reader.result || ''));
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (field: string, value: string) => {
    setEmailConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleTestEmail = async () => {
    if (!toEmail) {
      toast.error('Please enter a test email address');
      return;
    }
    setIsTesting(true);
    try {
      const res = await fetch('/api/email-config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ to_email: toEmail }),
      });

      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (e) {
        // If the response is not JSON (e.g. 502 Bad Gateway HTML), throw meaningful error
        throw new Error(`Server error: ${res.status} ${res.statusText}`);
      }

      if (!res.ok) {
        throw new Error(data?.error || 'Test failed');
      }

      toast.success(data?.message || 'Test email sent successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send test email');
      console.error(error);
    } finally {
      setIsTesting(false);
    }
  };

  const openEditDialog = (user: any) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowEditDialog(true);
  };

  const openComprehensiveEditDialog = (user: any) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name || "",
      email: user.email || "",
      mobile: user.mobile || "",
      role: user.role || "user",
      password: "",
      photo: user.photo || ""
    });
    setShowComprehensiveEditDialog(true);
  };

  const updateUserProfile = async () => {
    if (!editFormData.name || !editFormData.email) {
      toast.error('Name and email are required');
      return;
    }
    if (editFormData.password && editFormData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    try {
      // Update role
      if (editFormData.role !== selectedUser.role) {
        await fetch(`/api/users/${selectedUser.id}/role`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ role: editFormData.role }),
        });
      }

      // Update password if provided
      if (editFormData.password) {
        await fetch(`/api/users/${selectedUser.id}/password`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ newPassword: editFormData.password }),
        });
      }

      // Update photo if changed
      if (editFormData.photo !== selectedUser.photo) {
        await fetch(`/api/users/${selectedUser.id}/photo`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ photo: editFormData.photo }),
        });
      }

      toast.success('User profile updated successfully');
      setShowComprehensiveEditDialog(false);
      loadUsers();
    } catch (error) {
      toast.error('Failed to update user profile');
    } finally {
      setSaving(false);
    }
  };

  const handleEditPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setEditFormData(prev => ({ ...prev, photo: String(reader.result || '') }));
    };
    reader.readAsDataURL(file);
  };

  const createNewUser = async () => {
    if (!createUserData.name || !createUserData.email || !createUserData.password) {
      toast.error('Name, email, and password are required');
      return;
    }
    if (createUserData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(createUserData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(createUserData),
      });

      if (res.ok) {
        toast.success('User created successfully!');
        setShowCreateUserDialog(false);
        setCreateUserData({
          name: "",
          email: "",
          mobile: "",
          role: "user",
          password: "",
          photo: ""
        });
        loadUsers();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to create user');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCreateUserData(prev => ({ ...prev, photo: String(reader.result || '') }));
    };
    reader.readAsDataURL(file);
  };

  const openCreateUserDialog = () => {
    setCreateUserData({
      name: "",
      email: "",
      mobile: "",
      role: "user",
      password: "",
      photo: ""
    });
    setShowCreateUserDialog(true);
  };

  const openPermissionsDialog = async (user: any) => {
    setSelectedUser(user);
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${user.id}/permissions`, { credentials: 'include' });
      if (res.ok) {
        const permissions = await res.json();
        setSelectedUserPermissions(permissions);
        setShowPermissionsDialog(true);
      } else {
        toast.error('Failed to load permissions');
      }
    } catch (error) {
      toast.error('Error loading permissions');
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (page: string) => {
    setSelectedUserPermissions(prev =>
      prev.map(p => p.page === page ? { ...p, can_access: !p.can_access } : p)
    );
  };

  const savePermissions = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${selectedUser.id}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ permissions: selectedUserPermissions }),
      });
      if (res.ok) {
        toast.success('Permissions updated successfully');
        setShowPermissionsDialog(false);
      } else {
        toast.error('Failed to update permissions');
      }
    } catch (error) {
      toast.error('Error updating permissions');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteUser = (user: any) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  const performDeleteUser = async () => {
    if (!userToDelete) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (res.ok) {
        toast.success('User deleted successfully');
        loadUsers(); // Reload user list
        setShowDeleteDialog(false);
        setUserToDelete(null);
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to delete user');
      }
    } catch (error) {
      toast.error('Error deleting user');
    } finally {
      setSaving(false);
    }
  };

  const openPasswordDialog = (user: any) => {
    setSelectedUser(user);
    setNewPassword('');
    setShowPasswordDialog(true);
  };

  const openPhotoDialog = (user: any) => {
    setSelectedUser(user);
    setPhotoUrl(user.photo || '');
    setShowPhotoDialog(true);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          {/* Header */}
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
            <SidebarTrigger className="md:hidden" />
            <Separator orientation="vertical" className="h-6 md:hidden" />
            <div>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Settings
              </h1>
              <p className="text-xs text-muted-foreground">Configure application settings and manage users</p>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6">
            <div className="max-w-5xl mx-auto">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-auto lg:inline-grid">
                  <TabsTrigger value="email" className="gap-2">
                    <Mail className="h-4 w-4" />
                    <span className="hidden sm:inline">Email Config</span>
                  </TabsTrigger>
                  <TabsTrigger value="users" className="gap-2">
                    <Users className="h-4 w-4" />
                    <span className="hidden sm:inline">User Management</span>
                  </TabsTrigger>
                  <TabsTrigger value="telegram" className="gap-2">
                    <Send className="h-4 w-4" />
                    <span className="hidden sm:inline">Telegram Bot</span>
                  </TabsTrigger>
                  <TabsTrigger value="general" className="gap-2">
                    <SettingsIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">General</span>
                  </TabsTrigger>
                </TabsList>

                {/* Email Configuration Tab */}
                <TabsContent value="email" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-primary" />
                        Email Configuration
                      </CardTitle>
                      <CardDescription>
                        Configure SMTP settings for sending booking link emails
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <Label htmlFor="provider" className="flex items-center gap-2 mb-2">
                            <Server className="h-4 w-4" />
                            Email Provider
                          </Label>
                          <Select
                            onValueChange={(value) => {
                              if (value === 'brevo') {
                                setEmailConfig(prev => ({
                                  ...prev,
                                  smtp_host: 'smtp-relay.brevo.com',
                                  smtp_port: '587',
                                  security: 'tls'
                                }));
                                toast.info("Set to Brevo settings. Please use your SMTP Login as username and SMTP Key as password.");
                              } else if (value === 'gmail') {
                                setEmailConfig(prev => ({
                                  ...prev,
                                  smtp_host: 'smtp.gmail.com',
                                  smtp_port: '587',
                                  security: 'tls'
                                }));
                                toast.info("Set to Gmail settings. Please use your App Password.");
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a provider (Optional)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="custom">Custom SMTP</SelectItem>
                              <SelectItem value="gmail">Gmail (App Password)</SelectItem>
                              <SelectItem value="brevo">Brevo (formerly Sendinblue)</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground mt-2">
                            Select a provider to auto-fill recommended settings. For Render deployment, <strong>Brevo</strong> is recommended as it supports port 587/2525.
                          </p>
                        </div>

                        <div className="md:col-span-2">
                          <Label htmlFor="smtp_host" className="flex items-center gap-2">
                            <Server className="h-4 w-4" />
                            SMTP Host
                          </Label>
                          <Input
                            id="smtp_host"
                            value={emailConfig.smtp_host}
                            onChange={(e) => handleChange('smtp_host', e.target.value)}
                            placeholder="smtp.gmail.com"
                          />
                        </div>

                        <div>
                          <Label htmlFor="smtp_port">Port</Label>
                          <Input
                            id="smtp_port"
                            type="number"
                            value={emailConfig.smtp_port}
                            onChange={(e) => handleChange('smtp_port', e.target.value)}
                            placeholder="587"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            587 for TLS, 465 for SSL, 2525 for Brevo (Alternative)
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="security">Security</Label>
                          <Select value={emailConfig.security} onValueChange={(value) => handleChange('security', value)}>
                            <SelectTrigger id="security">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="auto">Auto</SelectItem>
                              <SelectItem value="tls">TLS/STARTTLS</SelectItem>
                              <SelectItem value="ssl">SSL</SelectItem>
                              <SelectItem value="none">None</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="smtp_user">Username</Label>
                          <Input
                            id="smtp_user"
                            value={emailConfig.smtp_user}
                            onChange={(e) => handleChange('smtp_user', e.target.value)}
                            placeholder="Username (e.g., email@example.com)"
                          />
                        </div>

                        <div>
                          <Label htmlFor="smtp_password">Password</Label>
                          <Input
                            id="smtp_password"
                            type="password"
                            value={emailConfig.smtp_password}
                            onChange={(e) => handleChange('smtp_password', e.target.value)}
                            placeholder="Password (App Password or API Key)"
                          />
                        </div>

                        <div>
                          <Label htmlFor="from_email">From email address</Label>
                          <Input
                            id="from_email"
                            type="email"
                            value={emailConfig.from_email}
                            onChange={(e) => handleChange('from_email', e.target.value)}
                            placeholder="From email"
                          />
                        </div>

                        <div>
                          <Label htmlFor="to_email">To email address</Label>
                          <Input
                            id="to_email"
                            type="email"
                            value={toEmail}
                            onChange={(e) => setToEmail(e.target.value)}
                            placeholder="To email"
                          />
                        </div>
                      </div>

                      {/* Test Button */}
                      <div className="pt-4">
                        <Button
                          onClick={handleTestEmail}
                          disabled={isTesting}
                          className="w-full md:w-auto px-8"
                        >
                          {isTesting ? "Testing..." : "Test it"}
                        </Button>
                      </div>

                      <div className="pt-4 border-t">
                        <Button
                          onClick={handleSave}
                          disabled={isSaving}
                          className="w-full"
                        >
                          <Save className="mr-2 h-4 w-4" />
                          {isSaving ? "Saving..." : "Save Configuration"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Information Card */}
                  <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
                    <CardHeader>
                      <CardTitle className="text-sm">Important Notes</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <p className="text-muted-foreground">
                        • For Gmail: Enable 2-factor authentication and generate an App Password
                      </p>
                      <p className="text-muted-foreground">
                        • Use port 587 for TLS or port 465 for SSL
                      </p>
                      <p className="text-muted-foreground">
                        • Configuration is stored securely in the database
                      </p>
                      <p className="text-muted-foreground">
                        • Test the configuration by generating and sending a booking link
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* User Management Tab */}
                <TabsContent value="users" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            User Management
                          </CardTitle>
                          <CardDescription>
                            Manage user accounts, roles, and permissions (Admin Only)
                            <span className={`ml-2 font-semibold ${adminCount >= 2 ? 'text-orange-600' : 'text-green-600'}`}>
                              • Administrators: {adminCount}/2
                            </span>
                          </CardDescription>
                        </div>
                        <Button onClick={openCreateUserDialog} className="gap-2">
                          <UserPlus className="h-4 w-4" />
                          Create New User
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {loadingUsers ? (
                        <p className="text-center py-8 text-muted-foreground">Loading users...</p>
                      ) : users.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">No users found</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {users.map((user) => (
                            <Card key={user.id} className="border-2">
                              <CardContent className="pt-6 space-y-4">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-16 w-16">
                                    <AvatarImage src={user.photo || undefined} />
                                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-bold text-xl">
                                      {user.name?.charAt(0)?.toUpperCase() || "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold truncate">{user.name}</h3>
                                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                                    {user.mobile && (
                                      <p className="text-xs text-muted-foreground">{user.mobile}</p>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="gap-1">
                                    <Shield className="h-3 w-3" />
                                    {user.role === 'admin' ? 'Administrator' : 'User'}
                                  </Badge>
                                </div>

                                <div className="flex flex-col gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openComprehensiveEditDialog(user)}
                                    className="w-full"
                                  >
                                    <UserCog className="h-4 w-4 mr-2" />
                                    Edit Profile
                                  </Button>
                                  {user.role !== 'admin' && (
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => openPermissionsDialog(user)}
                                      className="w-full"
                                    >
                                      <Shield className="h-4 w-4 mr-2" />
                                      Manage Permissions
                                    </Button>
                                  )}
                                  {user.id !== currentUser?.id && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => confirmDeleteUser(user)}
                                      className="w-full text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete User
                                    </Button>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Telegram Bot Configuration Tab */}
                <TabsContent value="telegram" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Send className="h-5 w-5 text-primary" />
                        Telegram Bot Configuration
                      </CardTitle>
                      <CardDescription>
                        Configure Telegram bot for automated notifications
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Enable/Disable Toggle */}
                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div className="space-y-0.5">
                          <Label htmlFor="telegram-enabled" className="text-base font-semibold">
                            Enable Telegram Notifications
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Turn on to receive automated notifications via Telegram
                          </p>
                        </div>
                        <Switch
                          id="telegram-enabled"
                          checked={telegramConfig.enabled}
                          onCheckedChange={(checked) =>
                            setTelegramConfig(prev => ({ ...prev, enabled: checked }))
                          }
                        />
                      </div>

                      {/* Bot Token */}
                      <div className="space-y-2">
                        <Label htmlFor="bot-token" className="flex items-center gap-2">
                          <Key className="h-4 w-4" />
                          Bot Token
                        </Label>
                        <Input
                          id="bot-token"
                          type="password"
                          value={telegramConfig.bot_token}
                          onChange={(e) => setTelegramConfig(prev => ({ ...prev, bot_token: e.target.value }))}
                          placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                        />
                        <p className="text-xs text-muted-foreground">
                          Get your bot token from @BotFather on Telegram
                        </p>
                      </div>

                      {/* Chat ID */}
                      <div className="space-y-2">
                        <Label htmlFor="chat-id">Chat ID</Label>
                        <Input
                          id="chat-id"
                          value={telegramConfig.chat_id}
                          onChange={(e) => setTelegramConfig(prev => ({ ...prev, chat_id: e.target.value }))}
                          placeholder="-1001234567890"
                        />
                        <p className="text-xs text-muted-foreground">
                          Your chat/group ID (use @userinfobot to find it)
                        </p>
                      </div>

                      {/* Notification Preferences */}
                      <div className="space-y-3">
                        <Label className="text-base font-semibold">Notification Preferences</Label>
                        <div className="space-y-3 pl-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="notify-link-booking" className="font-normal cursor-pointer">
                              Booking via Link
                            </Label>
                            <Switch
                              id="notify-link-booking"
                              checked={telegramConfig.notify_on_link_booking}
                              onCheckedChange={(checked) =>
                                setTelegramConfig(prev => ({ ...prev, notify_on_link_booking: checked }))
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="notify-billing-ready" className="font-normal cursor-pointer">
                              Ready for Billing (Last day of booking)
                            </Label>
                            <Switch
                              id="notify-billing-ready"
                              checked={telegramConfig.notify_on_billing_ready}
                              onCheckedChange={(checked) =>
                                setTelegramConfig(prev => ({ ...prev, notify_on_billing_ready: checked }))
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="notify-month-end" className="font-normal cursor-pointer">
                              Month End Summary
                            </Label>
                            <Switch
                              id="notify-month-end"
                              checked={telegramConfig.notify_on_month_end}
                              onCheckedChange={(checked) =>
                                setTelegramConfig(prev => ({ ...prev, notify_on_month_end: checked }))
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="notify-login" className="font-normal cursor-pointer">
                              User Login Alerts
                            </Label>
                            <Switch
                              id="notify-login"
                              checked={telegramConfig.notify_on_login}
                              onCheckedChange={(checked) =>
                                setTelegramConfig(prev => ({ ...prev, notify_on_login: checked }))
                              }
                            />
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4">
                        <Button
                          onClick={handleSaveTelegramConfig}
                          disabled={isSavingTelegram}
                          className="gap-2"
                        >
                          <Save className="h-4 w-4" />
                          {isSavingTelegram ? "Saving..." : "Save Configuration"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleTestTelegram}
                          disabled={isTestingTelegram}
                          className="gap-2"
                        >
                          <Send className="h-4 w-4" />
                          {isTestingTelegram ? "Testing..." : "Test Connection"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Send Details Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Send Details
                      </CardTitle>
                      <CardDescription>
                        Manually send booking details and reports to Telegram
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Upcoming Programmes */}
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h4 className="font-semibold">Upcoming Programmes</h4>
                            <p className="text-sm text-muted-foreground">
                              Send list of upcoming bookings
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={handleSendUpcoming}
                          disabled={isSendingUpcoming || !telegramConfig.enabled}
                          variant="outline"
                          className="gap-2"
                        >
                          <Send className="h-4 w-4" />
                          {isSendingUpcoming ? "Sending..." : "Send"}
                        </Button>
                      </div>

                      {/* Pending Bills and Payment */}
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                            <DollarSign className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                          </div>
                          <div>
                            <h4 className="font-semibold">Pending Bills and Payment</h4>
                            <p className="text-sm text-muted-foreground">
                              Send list of bookings with pending payments
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={handleSendPendingBills}
                          disabled={isSendingPendingBills || !telegramConfig.enabled}
                          variant="outline"
                          className="gap-2"
                        >
                          <Send className="h-4 w-4" />
                          {isSendingPendingBills ? "Sending..." : "Send"}
                        </Button>
                      </div>

                      {/* Ready for Billing */}
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <h4 className="font-semibold">Ready for Billing</h4>
                            <p className="text-sm text-muted-foreground">
                              Send list of completed bookings ready for billing
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={handleSendReadyBilling}
                          disabled={isSendingReadyBilling || !telegramConfig.enabled}
                          variant="outline"
                          className="gap-2"
                        >
                          <Send className="h-4 w-4" />
                          {isSendingReadyBilling ? "Sending..." : "Send"}
                        </Button>
                      </div>

                      {!telegramConfig.enabled && (
                        <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-800 rounded-lg">
                          <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            ⚠️ Please enable Telegram notifications above to use these features
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* General Settings Tab */}
                <TabsContent value="general" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <SettingsIcon className="h-5 w-5 text-primary" />
                        General Settings
                      </CardTitle>
                      <CardDescription>
                        Additional settings and configurations (Coming Soon)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-center py-8 text-muted-foreground">
                        More settings will be added here in future updates
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </SidebarInset>
      </div>

      {/* Edit Role Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update User Role</DialogTitle>
            <DialogDescription>
              Change the role for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="role">Role</Label>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={updateRole} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min 6 characters)"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancel
            </Button>
            <Button onClick={updatePassword} disabled={saving}>
              {saving ? "Resetting..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Photo Dialog */}
      <Dialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Profile Photo</DialogTitle>
            <DialogDescription>
              Upload a new photo for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="photoUpload">Upload Photo</Label>
              <Input
                id="photoUpload"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
              />
            </div>
            {photoUrl && (
              <div className="flex justify-center">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={photoUrl} />
                  <AvatarFallback>Preview</AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPhotoDialog(false)}>
              Cancel
            </Button>
            <Button onClick={updatePhoto} disabled={saving || !photoUrl}>
              {saving ? "Updating..." : "Update Photo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comprehensive Edit Profile Dialog */}
      <Dialog open={showComprehensiveEditDialog} onOpenChange={setShowComprehensiveEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
            <DialogDescription>
              Edit all profile information for {selectedUser?.name}. Changes will be saved immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                type="text"
                value={editFormData.name}
                onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter full name"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
              />
            </div>

            {/* Mobile */}
            <div className="space-y-2">
              <Label htmlFor="edit-mobile">Mobile Number</Label>
              <Input
                id="edit-mobile"
                type="tel"
                value={editFormData.mobile}
                onChange={(e) => setEditFormData(prev => ({ ...prev, mobile: e.target.value }))}
                placeholder="Enter mobile number"
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select
                value={editFormData.role}
                onValueChange={(value) => setEditFormData(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="edit-password">New Password</Label>
              <Input
                id="edit-password"
                type="password"
                value={editFormData.password}
                onChange={(e) => setEditFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Leave blank to keep current password"
              />
              <p className="text-xs text-muted-foreground">
                Minimum 6 characters. Leave blank if you don't want to change the password.
              </p>
            </div>

            {/* Photo Upload */}
            <div className="space-y-2">
              <Label htmlFor="edit-photo">Profile Photo</Label>
              <Input
                id="edit-photo"
                type="file"
                accept="image/*"
                onChange={handleEditPhotoUpload}
              />
              {editFormData.photo && (
                <div className="flex justify-center pt-2">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={editFormData.photo} />
                    <AvatarFallback>
                      {editFormData.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowComprehensiveEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={updateUserProfile} disabled={saving}>
              {saving ? "Saving Changes..." : "Save All Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create New User Dialog */}
      <Dialog open={showCreateUserDialog} onOpenChange={setShowCreateUserDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Create New User
            </DialogTitle>
            <DialogDescription>
              Add a new user to the system. All fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="create-name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Name *
              </Label>
              <Input
                id="create-name"
                type="text"
                value={createUserData.name}
                onChange={(e) => setCreateUserData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter full name"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="create-email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email *
              </Label>
              <Input
                id="create-email"
                type="email"
                value={createUserData.email}
                onChange={(e) => setCreateUserData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="user@example.com"
                required
              />
            </div>

            {/* Mobile */}
            <div className="space-y-2">
              <Label htmlFor="create-mobile">Mobile Number</Label>
              <Input
                id="create-mobile"
                type="tel"
                value={createUserData.mobile}
                onChange={(e) => setCreateUserData(prev => ({ ...prev, mobile: e.target.value }))}
                placeholder="+91 9876543210"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="create-password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Password *
              </Label>
              <Input
                id="create-password"
                type="password"
                value={createUserData.password}
                onChange={(e) => setCreateUserData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Minimum 6 characters"
                required
              />
              <p className="text-xs text-muted-foreground">
                Password must be at least 6 characters long
              </p>
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="create-role" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Role
              </Label>
              <Select
                value={createUserData.role}
                onValueChange={(value) => setCreateUserData(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger id="create-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin" disabled={adminCount >= 2}>
                    Administrator {adminCount >= 2 ? '(Limit reached: 2/2)' : ''}
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className={`text-xs ${adminCount >= 2 ? 'text-orange-600' : 'text-muted-foreground'}`}>
                {adminCount >= 2
                  ? '⚠️ Maximum 2 administrators allowed. Admin option is disabled.'
                  : 'Administrators have full access to all features'}
              </p>
            </div>

            {/* Photo Upload */}
            <div className="space-y-2">
              <Label htmlFor="create-photo" className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Profile Photo
              </Label>
              <Input
                id="create-photo"
                type="file"
                accept="image/*"
                onChange={handleCreatePhotoUpload}
              />
              {createUserData.photo && (
                <div className="flex justify-center pt-2">
                  <Avatar className="h-24 w-24 border-2 border-primary/20">
                    <AvatarImage src={createUserData.photo} />
                    <AvatarFallback>
                      {createUserData.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateUserDialog(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={createNewUser}
              disabled={saving || !createUserData.name || !createUserData.email || !createUserData.password}
            >
              {saving ? "Creating User..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Management Dialog */}
      <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Manage Page Permissions
            </DialogTitle>
            <DialogDescription>
              Control which pages {selectedUser?.name} can access. Administrators always have full access.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            {selectedUserPermissions.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Loading permissions...</p>
            ) : (
              selectedUserPermissions.map((perm) => (
                <div
                  key={perm.page}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium capitalize">
                      {perm.page.replace('-', ' ')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {perm.page === 'dashboard' && 'Main dashboard and overview'}
                      {perm.page === 'add-booking' && 'Access to create new bookings'}
                      {perm.page === 'bookings' && 'View and manage bookings'}
                      {perm.page === 'programs' && 'View and manage training programs'}
                      {perm.page === 'booking-links' && 'Create and manage booking links'}
                      {perm.page === 'reports' && 'View reports and analytics'}
                      {perm.page === 'settings' && 'Application settings'}
                      {perm.page === 'user-management' && 'Manage users (admin only)'}
                    </p>
                  </div>
                  <Switch
                    checked={perm.can_access}
                    onCheckedChange={() => togglePermission(perm.page)}
                    disabled={saving}
                  />
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPermissionsDialog(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={savePermissions}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Permissions"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account
              <span className="font-semibold px-1">{userToDelete?.name}</span>
              and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                performDeleteUser();
              }}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              disabled={saving}
            >
              {saving ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
