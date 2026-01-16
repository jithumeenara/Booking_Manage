import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Booking } from "@/components/BookingCard";

// Fetch Bookings
const fetchBookings = async (): Promise<Booking[]> => {
    const res = await fetch("/api/bookings");
    if (!res.ok) throw new Error("Failed to fetch bookings");
    return res.json();
};

export const useBookings = () => {
    return useQuery({
        queryKey: ["bookings"],
        queryFn: fetchBookings,
        staleTime: 1000 * 60 * 1, // 1 minute stale time (data stays fresh for 1 min)
        gcTime: 1000 * 60 * 5, // 5 minutes cache garbage collection
    });
};

// Create Booking
export const useCreateBooking = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newBooking: any) => {
            const res = await fetch("/api/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newBooking),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create booking");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bookings"] });
            // toast handled in component for custom actions (like "Allocate Halls")
        },
        onError: (error: Error) => {
            // toast handled in component
        },
    });
};

// Update Booking
export const useUpdateBooking = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const res = await fetch(`/api/bookings/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update booking");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bookings"] });
        },
    });
};

// Delete Booking
export const useDeleteBooking = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/bookings/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete booking");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bookings"] });
            toast.success("Booking deleted successfully");
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });
};
