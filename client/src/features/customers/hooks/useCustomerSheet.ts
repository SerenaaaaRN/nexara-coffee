import type { KeyboardEvent } from "react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
    useDeleteCustomer,
    useUpdateLoyaltyPoints,
} from "@/features/customers/hooks/useCustomerMutations";
import type { CustomerRow } from "@/features/customers/types";

/**
 * State & handler untuk CustomerSheet.
 */
export const useCustomerSheet = (
    customer: CustomerRow,
    onOpenChange: (open: boolean) => void,
) => {
    const [editingPoints, setEditingPoints] = useState(false);
    const [pointsValue, setPointsValue] = useState(
        customer.loyaltyPoints.toString(),
    );
    const [editOpen, setEditOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(false);

    const updateLoyaltyMutation = useUpdateLoyaltyPoints();
    const deleteMutation = useDeleteCustomer();

    const startEditingPoints = () => {
        setPointsValue(customer.loyaltyPoints.toString());
        setEditingPoints(true);
    };

    const handlePointsSave = useCallback(async () => {
        const num = Number(pointsValue);
        if (Number.isNaN(num) || num < 0) {
            toast.error("Points must be a positive number");
            return;
        }
        const res = await updateLoyaltyMutation.mutateAsync({
            customerId: customer.id,
            points: num,
        });
        if (res.success) {
            toast.success("Points updated");
            setEditingPoints(false);
        } else {
            toast.error("Failed to update points");
        }
    }, [pointsValue, customer.id, updateLoyaltyMutation]);

    const handlePointsKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Enter") {
                e.preventDefault();
                handlePointsSave();
            }
            if (e.key === "Escape") {
                setEditingPoints(false);
                setPointsValue(customer.loyaltyPoints.toString());
            }
        },
        [handlePointsSave, customer.loyaltyPoints],
    );

    const handleDelete = useCallback(async () => {
        const res = await deleteMutation.mutateAsync(customer.id);
        if (res.success) {
            toast.success("Customer removed");
            setDeleteTarget(false);
            onOpenChange(false);
        } else {
            toast.error("Failed to remove customer");
        }
    }, [customer.id, deleteMutation, onOpenChange]);

    return {
        editingPoints,
        pointsValue,
        setPointsValue,
        editOpen,
        setEditOpen,
        deleteTarget,
        setDeleteTarget,
        updateLoyaltyPending: updateLoyaltyMutation.isPending,
        startEditingPoints,
        handlePointsSave,
        handlePointsKeyDown,
        handleDelete,
    };
};
