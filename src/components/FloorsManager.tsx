import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil, Trash2, Plus, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Floor {
    id: string;
    name: string;
    display_order: number;
}

export function FloorsManager() {
    const [floors, setFloors] = useState<Floor[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingFloor, setEditingFloor] = useState<Floor | null>(null);
    const [formData, setFormData] = useState({ name: "", display_order: 0 });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadFloors();
    }, []);

    const loadFloors = async () => {
        try {
            const res = await fetch("/api/floors");
            if (res.ok) {
                const data = await res.json();
                setFloors(data);
            }
        } catch (error) {
            toast.error("Failed to load floors");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (floor?: Floor) => {
        if (floor) {
            setEditingFloor(floor);
            setFormData({ name: floor.name, display_order: floor.display_order });
        } else {
            setEditingFloor(null);
            setFormData({ name: "", display_order: floors.length + 1 });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name) {
            toast.error("Floor name is required");
            return;
        }

        setSaving(true);
        try {
            const url = editingFloor ? `/api/floors/${editingFloor.id}` : "/api/floors";
            const method = editingFloor ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                toast.success(editingFloor ? "Floor updated" : "Floor created");
                setIsDialogOpen(false);
                loadFloors();
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to save");
            }
        } catch (error) {
            toast.error("Error saving floor");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This might affect grouping of training halls.")) return;

        try {
            const res = await fetch(`/api/floors/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Floor deleted");
                loadFloors();
            } else {
                toast.error("Failed to delete floor");
            }
        } catch (error) {
            toast.error("Error deleting floor");
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Floor Management</CardTitle>
                        <CardDescription>Manage floors/levels for grouping training halls.</CardDescription>
                    </div>
                    <Button onClick={() => handleOpenDialog()} size="sm">
                        <Plus className="h-4 w-4 mr-2" /> Add Floor
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="text-center py-4">Loading...</div>
                ) : floors.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No floors found. Add one to get started.</div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Order</TableHead>
                                <TableHead>Before Name</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {floors.map((floor) => (
                                <TableRow key={floor.id}>
                                    <TableCell>{floor.display_order}</TableCell>
                                    <TableCell className="font-medium">{floor.name}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(floor)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(floor.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingFloor ? "Edit Floor" : "Add Floor"}</DialogTitle>
                        <DialogDescription>Create a new floor or level identifier.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Floor Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Ground Floor, Level 1"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="order">Display Order</Label>
                            <Input
                                id="order"
                                type="number"
                                value={formData.display_order}
                                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
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
        </Card>
    );
}
