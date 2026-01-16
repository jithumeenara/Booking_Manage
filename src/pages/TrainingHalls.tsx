import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Building, Layers, Users, Calendar, Check, Info, Clock } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface TrainingHall {
    id: string;
    name: string;
    floor?: string;
    code: string;
    capacity: number;
    is_active: boolean;
    hall_sub_name?: string;
    hall_rent_per_day?: number;
}

interface Floor {
    id: string;
    name: string;
    display_order: number;
}

interface Booking {
    id: string;
    department_agency: string;
    start_date: string;
    end_date: string;
    needs_training_hall: boolean;
    status: string;
    contact_person_name?: string;
}

interface TodayAllocation {
    id: string;
    department_agency: string;
    start_date: string;
    end_date: string;
    hall_id: string;
    hall_name: string;
    floor: string;
}

export default function TrainingHalls() {
    const [halls, setHalls] = useState<TrainingHall[]>([]);
    const [floors, setFloors] = useState<Floor[]>([]);
    const [todayAllocations, setTodayAllocations] = useState<TodayAllocation[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingHall, setEditingHall] = useState<TrainingHall | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        floor: "",
        code: "",
        capacity: 0,
        is_active: true,
        hall_sub_name: "",
        hall_rent_per_day: 0
    });
    const [saving, setSaving] = useState(false);
    const [viewingHall, setViewingHall] = useState<TrainingHall | null>(null);
    const [permissions, setPermissions] = useState({
        canAdd: false,
        canEdit: false,
        canDelete: false
    });

    useEffect(() => {
        loadData();

        // Refresh data when window gains focus
        const handleFocus = () => {
            loadData();
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Calculate Start and End of "Today" in local time, converted to ISO
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString();
            const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

            const headers = { 'Cache-Control': 'no-store', 'Pragma': 'no-cache' };
            const [hallsRes, floorsRes, todayRes] = await Promise.all([
                fetch("/api/training-halls", { headers }),
                fetch("/api/floors", { headers }),
                fetch(`/api/bookings/today-allocations?startOfDay=${startOfDay}&endOfDay=${endOfDay}`, { headers })
            ]);

            if (hallsRes.ok && floorsRes.ok) {
                const hallsData = await hallsRes.json();
                const floorsData = await floorsRes.json();
                setHalls(hallsData.map((h: any) => ({ ...h, is_active: Boolean(h.is_active) })));
                setFloors(floorsData);

                if (todayRes.ok) {
                    setTodayAllocations(await todayRes.json());
                }

                try {
                    const meRes = await fetch("/api/auth/me");
                    if (meRes.ok) {
                        const user = await meRes.json();
                        if (user.role === 'admin') {
                            setPermissions({ canAdd: true, canEdit: true, canDelete: true });
                        } else {
                            const permRes = await fetch(`/api/users/${user.id}/permissions`);
                            if (permRes.ok) {
                                const perms = await permRes.json();
                                const hasPerm = (p: string) => !!perms.find((perm: any) => perm.page === p)?.can_access;
                                setPermissions({
                                    canAdd: hasPerm('add-training-hall'),
                                    canEdit: hasPerm('edit-training-hall'),
                                    canDelete: hasPerm('delete-training-hall')
                                });
                            }
                        }
                    }
                } catch (e) {
                    console.error("Error checking permissions", e);
                }

            } else {
                toast.error("Failed to load data");
            }
        } catch (error) {
            toast.error("Error loading data");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (hall?: TrainingHall) => {
        if (hall) {
            setEditingHall(hall);
            setFormData({
                name: hall.name,
                floor: hall.floor || "",
                code: hall.code,
                capacity: hall.capacity,
                is_active: hall.is_active,
                hall_sub_name: hall.hall_sub_name || "",
                hall_rent_per_day: hall.hall_rent_per_day || 0
            });
        } else {
            setEditingHall(null);
            setFormData({
                name: "",
                floor: "",
                code: "",
                capacity: 0,
                is_active: true,
                hall_sub_name: "",
                hall_rent_per_day: 0
            });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.code) {
            toast.error("Name and Code are required");
            return;
        }

        setSaving(true);
        try {
            const url = editingHall ? `/api/training-halls/${editingHall.id}` : "/api/training-halls";
            const method = editingHall ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                toast.success(editingHall ? "Training hall updated" : "Training hall created");
                setIsDialogOpen(false);
                loadData();
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to save");
            }
        } catch (error) {
            toast.error("Error saving training hall");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this training hall?")) return;

        try {
            const res = await fetch(`/api/training-halls/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Training hall deleted");
                loadData();
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to delete");
            }
        } catch (error) {
            toast.error("Error deleting training hall");
        }
    };

    const toggleStatus = async (hall: TrainingHall) => {
        try {
            const updatedHalls = halls.map(h => h.id === hall.id ? { ...h, is_active: !h.is_active } : h);
            setHalls(updatedHalls);

            const res = await fetch(`/api/training-halls/${hall.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...hall, is_active: !hall.is_active })
            });

            if (!res.ok) {
                setHalls(halls);
                toast.error("Failed to update status");
            }
        } catch (error) {
            setHalls(halls);
            toast.error("Error updating status");
        }
    };

    // Helper for natural sorting (e.g., A1, A2, ... A10)
    // Helper for natural sorting (e.g., A1, A2, ... A10)
    const naturalSort = (a: TrainingHall, b: TrainingHall) => {
        const valA = a.code || a.name || "";
        const valB = b.code || b.name || "";
        return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
    };

    // Group halls by floor and sort them
    const groupedHalls = floors.map(floor => ({
        floor,
        halls: halls
            .filter(h => h.floor === floor.name)
            .sort(naturalSort)
    }));

    // Find halls not in any known floor and sort them
    const knownFloorNames = new Set(floors.map(f => f.name));
    const unassignedHalls = halls
        .filter(h => !h.floor || !knownFloorNames.has(h.floor))
        .sort(naturalSort);

    return (
        <SidebarProvider defaultOpen={true}>
            <div className="flex min-h-screen w-full bg-gradient-to-br from-background via-background to-primary/5">
                <AppSidebar />
                <SidebarInset>
                    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border/50 bg-background/95 backdrop-blur px-6">
                        <SidebarTrigger className="md:hidden" />
                        <Separator orientation="vertical" className="h-6 md:hidden" />
                        <div className="flex items-center justify-between flex-1">
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                                    Training Halls
                                </h1>
                                <p className="text-xs text-muted-foreground">Manage facilities, allocations, and schedules</p>
                            </div>
                            {permissions.canAdd && (
                                <Button onClick={() => handleOpenDialog()}>
                                    <Plus className="h-4 w-4 mr-2" /> Add Hall
                                </Button>
                            )}
                        </div>
                    </header>

                    <main className="flex-1 p-6 space-y-8">
                        {loading ? (
                            <div className="flex h-[50vh] w-full items-center justify-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                            </div>
                        ) : (
                            <>
                                <Tabs defaultValue="allocations" className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <TabsList>
                                            <TabsTrigger value="halls">Training Halls</TabsTrigger>
                                            <TabsTrigger value="allocations">Today's Allocations</TabsTrigger>
                                        </TabsList>
                                        <div className="flex items-center text-sm text-muted-foreground">
                                            {halls.length} Total Halls
                                        </div>
                                    </div>

                                    <TabsContent value="allocations" className="space-y-4">
                                        {/* Today's Overview Section - Moved here */}
                                        <section className="space-y-4">
                                            <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                                                <ActivityIcon className="h-5 w-5" />
                                                Occupancy Overview
                                                <Badge variant="outline" className="ml-2 text-xs font-normal">
                                                    {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                                                </Badge>
                                            </div>
                                            {todayAllocations.length === 0 ? (
                                                <Card className="bg-muted/30 border-dashed">
                                                    <CardContent className="py-12 text-center text-muted-foreground text-sm">
                                                        <Calendar className="h-10 w-10 mx-auto opacity-20 mb-2" />
                                                        <p>No training halls are currently occupied today.</p>
                                                    </CardContent>
                                                </Card>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {todayAllocations.map(alloc => (
                                                        <Card key={`${alloc.id}-${alloc.hall_id}`} className="border-l-4 border-l-green-500 shadow-sm">
                                                            <CardHeader className="py-3 px-4 pb-2">
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <CardTitle className="text-sm font-semibold truncate" title={alloc.department_agency}>
                                                                            {alloc.department_agency}
                                                                        </CardTitle>
                                                                        <CardDescription className="text-xs mt-1 font-mono">
                                                                            {alloc.hall_name} ({alloc.floor || 'No Floor'})
                                                                        </CardDescription>
                                                                    </div>
                                                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 text-[10px] px-1.5 h-5">
                                                                        Occupied
                                                                    </Badge>
                                                                </div>
                                                            </CardHeader>
                                                            <CardFooter className="py-2 px-4 bg-muted/20 text-xs text-muted-foreground flex justify-between">
                                                                <span>
                                                                    {new Date(alloc.start_date).toLocaleDateString()} - {new Date(alloc.end_date).toLocaleDateString()}
                                                                </span>
                                                            </CardFooter>
                                                        </Card>
                                                    ))}
                                                </div>
                                            )}
                                        </section>
                                    </TabsContent>

                                    <TabsContent value="halls" className="space-y-6">
                                        {halls.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-[30vh] text-muted-foreground space-y-4">
                                                <Building className="h-12 w-12 opacity-20" />
                                                <p>No training halls found. Create one to get started.</p>
                                                <Button variant="outline" onClick={() => handleOpenDialog()}>
                                                    <Plus className="h-4 w-4 mr-2" /> Create First Hall
                                                </Button>
                                            </div>
                                        ) : (
                                            <>
                                                {groupedHalls.map(({ floor, halls }) => (
                                                    halls.length > 0 && (
                                                        <section key={floor.id} className="space-y-4">
                                                            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                                                <Layers className="h-4 w-4" />
                                                                {floor.name}
                                                            </div>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                                                {halls.map(hall => {
                                                                    const isOccupied = todayAllocations.some(a => a.hall_id === hall.id);
                                                                    return (
                                                                        <TrainingHallCard
                                                                            key={hall.id}
                                                                            hall={hall}
                                                                            onEdit={handleOpenDialog}
                                                                            onDelete={handleDelete}
                                                                            onToggle={toggleStatus}
                                                                            onViewDetails={() => setViewingHall(hall)}
                                                                            permissions={permissions}
                                                                            isOccupied={isOccupied}
                                                                        />
                                                                    );
                                                                })}
                                                            </div>
                                                        </section>
                                                    )
                                                ))}

                                                {unassignedHalls.length > 0 && (
                                                    <section className="space-y-4">
                                                        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                                            <Layers className="h-4 w-4" />
                                                            Other / Unassigned
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                                            {unassignedHalls.map(hall => {
                                                                const isOccupied = todayAllocations.some(a => a.hall_id === hall.id);
                                                                return (
                                                                    <TrainingHallCard
                                                                        key={hall.id}
                                                                        hall={hall}
                                                                        onEdit={handleOpenDialog}
                                                                        onDelete={handleDelete}
                                                                        onToggle={toggleStatus}
                                                                        onViewDetails={() => setViewingHall(hall)}
                                                                        permissions={permissions}
                                                                        isOccupied={isOccupied}
                                                                    />
                                                                );
                                                            })}
                                                        </div>
                                                    </section>
                                                )}
                                            </>
                                        )}
                                    </TabsContent>
                                </Tabs>
                            </>
                        )}
                    </main>

                    {/* Add/Edit Dialog */}
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingHall ? "Edit Training Hall" : "Add Training Hall"}</DialogTitle>
                                <DialogDescription>
                                    {editingHall ? "Update the details of the training hall." : "Enter details for the new training hall."}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="code">Hall Code (Unique)</Label>
                                    <Input
                                        id="code"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        placeholder="e.g. MH01"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="name">Hall Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sub-name">Sub Name (Optional)</Label>
                                    <Input
                                        id="sub-name"
                                        value={formData.hall_sub_name}
                                        onChange={(e) => setFormData({ ...formData, hall_sub_name: e.target.value })}
                                        placeholder="e.g. Wing A"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="floor">Floor / Level</Label>
                                    <Select
                                        value={formData.floor}
                                        onValueChange={(value) => setFormData({ ...formData, floor: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Floor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {floors.map(floor => (
                                                <SelectItem key={floor.id} value={floor.name}>{floor.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {floors.length === 0 && (
                                        <p className="text-xs text-muted-foreground">
                                            No floors defined. Go to Settings &gt; Floors to add format levels.
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="capacity">Capacity</Label>
                                    <Input
                                        id="capacity"
                                        type="number"
                                        value={formData.capacity}
                                        onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                                        placeholder="e.g. 150"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="rent">Rent Per Day (₹)</Label>
                                    <Input
                                        id="rent"
                                        type="number"
                                        value={formData.hall_rent_per_day}
                                        onChange={(e) => setFormData({ ...formData, hall_rent_per_day: parseFloat(e.target.value) || 0 })}
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="status">Active Status</Label>
                                    <Switch
                                        id="status"
                                        checked={formData.is_active}
                                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleSave} disabled={saving}>
                                    {saving ? "Saving..." : "Save"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Hall Details Dialog */}
                    {viewingHall && (
                        <HallDetailsDialog
                            hall={viewingHall}
                            open={!!viewingHall}
                            onOpenChange={(open) => !open && setViewingHall(null)}
                        />
                    )}

                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}

function ActivityIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
    )
}

function TrainingHallCard({ hall, onEdit, onDelete, onToggle, onViewDetails, permissions, isOccupied }: {
    hall: TrainingHall,
    onEdit: (h: TrainingHall) => void,
    onDelete: (id: string) => void,
    onToggle: (h: TrainingHall) => void,
    onViewDetails: () => void,
    permissions: { canAdd: boolean, canEdit: boolean, canDelete: boolean },
    isOccupied?: boolean
}) {
    return (
        <Card
            className={cn(
                "transition-all hover:shadow-md group flex flex-col justify-between h-full cursor-pointer relative overflow-hidden",
                isOccupied && "border-l-4 border-l-red-500/50"
            )}
            onClick={(e) => {
                if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('[role="switch"]')) return;
                onViewDetails();
            }}
        >
            <div className={`absolute top-0 left-0 w-1 h-full ${hall.is_active ? 'bg-green-500' : 'bg-red-500'}`} />

            <div className="p-3 pl-5 space-y-2">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-sm leading-tight">{hall.name}</h3>
                            {isOccupied && (
                                <Badge variant="outline" className="text-[10px] bg-red-50 text-red-600 border-red-200 ml-2 shrink-0 h-5 px-1.5">
                                    Booked
                                </Badge>
                            )}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{hall.code}</p>
                    </div>
                    {/* Minimal actions */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {permissions.canEdit && (
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(hall)}>
                                <Pencil className="h-3 w-3" />
                            </Button>
                        )}
                        {permissions.canDelete && (
                            <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-destructive" onClick={() => onDelete(hall.id)}>
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        <span>{hall.floor || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{hall.capacity}</span>
                    </div>
                </div>
            </div>

            <div className="px-3 pb-3 pl-5 flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2">
                    <Switch
                        checked={hall.is_active}
                        onCheckedChange={() => onToggle(hall)}
                        className="scale-75 origin-left"
                        disabled={!permissions.canEdit}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] px-2 h-6 cursor-pointer hover:bg-muted" onClick={onViewDetails}>
                        Schedule
                    </Badge>
                    <AllocateHallDialog hall={hall} minimal={true} />
                </div>
            </div>
        </Card>
    );
}

function AllocateHallDialog({ hall, minimal }: { hall: TrainingHall, minimal?: boolean }) {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [selectedBooking, setSelectedBooking] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (open) {
            fetchBookings();
        }
    }, [open]);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/bookings");
            if (res.ok) {
                const data: Booking[] = await res.json();

                // Filter for:
                // 1. Pending or Confirmed bookings
                // 2. Start Date in Future OR End Date in Future (basically not past bookings)
                // Note: User requested "Do not list bookings that have passed the booking date"
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const validBookings = data.filter(b => {
                    const endDate = new Date(b.end_date);
                    // Standardize time for comparison
                    endDate.setHours(0, 0, 0, 0);

                    return (b.status === "pending" || b.status === "confirmed") && endDate >= today;
                });

                setBookings(validBookings);
            }
        } catch (error) {
            toast.error("Failed to fetch bookings");
        } finally {
            setLoading(false);
        }
    };

    const handleAllocate = async () => {
        if (!selectedBooking) return;

        try {
            const res = await fetch(`/api/bookings/${selectedBooking}/halls`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ hall_id: hall.id })
            });

            if (res.ok) {
                toast.success("Hall allocated successfully");
                setOpen(false);
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to allocate hall");
            }
        } catch (error) {
            toast.error("Error allocation hall");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant={minimal ? "secondary" : "outline"} size="sm" className={minimal ? "h-6 text-[10px] px-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground" : "gap-2 h-8"}>
                    {minimal ? "Allocate" : (
                        <>
                            <Calendar className="h-3.5 w-3.5" />
                            Allocate
                        </>
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Allocate {hall.name}</DialogTitle>
                    <DialogDescription>
                        Assign this training hall to an upcoming booking.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Select Booking</Label>
                        <Select value={selectedBooking} onValueChange={setSelectedBooking}>
                            <SelectTrigger>
                                <SelectValue placeholder="Search or select booking" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                                {loading ? (
                                    <div className="p-2 text-center text-xs text-muted-foreground">Loading...</div>
                                ) : bookings.length === 0 ? (
                                    <div className="p-2 text-center text-xs text-muted-foreground">No valid upcoming bookings found</div>
                                ) : (
                                    bookings.map((booking: any) => (
                                        <SelectItem key={booking.id} value={booking.id}>
                                            <div className="flex flex-col text-left">
                                                <span className="font-medium text-primary line-clamp-1">{booking.department_agency}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleAllocate} disabled={!selectedBooking}>
                        <Check className="h-4 w-4 mr-2" />
                        Confirm Allocation
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function HallDetailsDialog({ hall, open, onOpenChange }: {
    hall: TrainingHall,
    open: boolean,
    onOpenChange: (open: boolean) => void
}) {
    const [schedule, setSchedule] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (open) {
            fetchSchedule();
        }
    }, [open]);

    const fetchSchedule = async () => {
        setLoading(true);
        try {
            // Use local date for timezone adjustment
            // We want bookings that overlap with "Start of Today" onwards
            const now = new Date();
            // Create a date object for 00:00:00 today
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString();

            const res = await fetch(`/api/training-halls/${hall.id}/schedule?startFrom=${startOfDay}`, {
                headers: { 'Cache-Control': 'no-store', 'Pragma': 'no-cache' }
            });

            if (res.ok) {
                setSchedule(await res.json());
            }
        } catch (error) {
            toast.error("Failed to fetch schedule");
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveAllocation = async (bookingId: string) => {
        if (!confirm("Are you sure you want to remove this allocation?")) return;

        try {
            const res = await fetch(`/api/training-halls/${hall.id}/allocations/${bookingId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                toast.success("Allocation removed successfully");
                fetchSchedule();
            } else {
                toast.error("Failed to remove allocation");
            }
        } catch (error) {
            toast.error("Error removing allocation");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5 text-primary" />
                        {hall.name} - Schedule
                    </DialogTitle>
                    <DialogDescription>
                        Upcoming and current bookings for this hall.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                        </div>
                    ) : schedule.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground space-y-2">
                            <Calendar className="h-10 w-10 mx-auto opacity-20" />
                            <p>No upcoming bookings found for this hall.</p>
                        </div>
                    ) : (
                        <ScrollArea className="h-[300px] pr-4">
                            <div className="space-y-4">
                                {schedule.map((item, i) => (
                                    <div key={item.id} className="group flex gap-4 p-3 rounded-lg border bg-card text-card-foreground shadow-sm relative">
                                        <div className="flex flex-col items-center justify-center w-12 h-12 rounded bg-primary/10 text-primary-700 font-bold text-xs shrink-0">
                                            <span>{new Date(item.start_date).getDate()}</span>
                                            <span className="uppercase text-[10px]">{new Date(item.start_date).toLocaleString('default', { month: 'short' })}</span>
                                        </div>
                                        <div className="space-y-1 overflow-hidden flex-1">
                                            <h4 className="font-semibold text-sm truncate" title={item.department_agency}>
                                                {item.department_agency}
                                            </h4>
                                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                <span>
                                                    {new Date(item.start_date).toLocaleDateString()} - {new Date(item.end_date).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {item.contact_person_name && (
                                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Users className="h-3 w-3" />
                                                    <span>{item.contact_person_name}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="shrink-0 flex items-center">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => handleRemoveAllocation(item.id)}
                                                title="Remove Allocation"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>

                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
