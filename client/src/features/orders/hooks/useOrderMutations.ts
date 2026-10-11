import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import type {
    cancelOrderSchema,
    createOrderSchema,
    updateStatusSchema,
} from "@/features/orders/types";
import { myPortalKeys, orderKeys } from "@/features/query-keys";
import { api, toEnvelope } from "@/lib/eden";

/**
 * Membuat order baru berserta item-itemnya.
 */
export const createOrder = async (input: z.infer<typeof createOrderSchema>) => {
    const { data, error } = await api.orders.post({
        branchId: input.branchId,
        customerId: input.customerId,
        items: input.items.map((i) => ({
            menuItemId: i.menuItemId,
            name: i.name,
            price: i.price,
            variant: i.variant,
            qty: i.qty,
        })),
    });
    return toEnvelope(data, error);
};

/**
 * Mengupdate status order (contoh: pending -> preparing -> completed).
 * Akrual poin loyalty saat transisi ke completed ditangani server (best-effort).
 */
export const updateOrderStatus = async (
    input: z.infer<typeof updateStatusSchema>,
) => {
    const { data, error } = await api
        .orders({ id: input.orderId })
        .status.post({ status: input.status });
    return toEnvelope(data, error);
};

/**
 * Membatalkan order. Tidak bisa membatalkan order yang sudah 'completed' atau 'cancelled'.
 */
export const cancelOrder = async (input: z.infer<typeof cancelOrderSchema>) => {
    const { data, error } = await api
        .orders({ id: input.orderId })
        .cancel.post({ reason: input.reason });
    return toEnvelope(data, error);
};

/**
 * Custom hook untuk mutasi pembuatan order baru.
 * Otomatis memvalidasi ulang query list orders jika berhasil.
 */
export function useCreateOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: z.infer<typeof createOrderSchema>) =>
            createOrder(data),
        onSuccess: (res) => {
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
            }
        },
    });
}

/**
 * Custom hook untuk mutasi update status order.
 * Otomatis memvalidasi ulang query list dan detail order jika berhasil.
 */
export function useUpdateOrderStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: z.infer<typeof updateStatusSchema>) =>
            updateOrderStatus(data),
        onSuccess: (res, vars) => {
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
                queryClient.invalidateQueries({
                    queryKey: orderKeys.detail(vars.orderId),
                });
                // Poin/tier member bisa berubah saat completed → segarkan portal.
                queryClient.invalidateQueries({
                    queryKey: myPortalKeys.all,
                });
            }
        },
    });
}

/**
 * Custom hook untuk mutasi pembatalan order.
 * Otomatis memvalidasi ulang query list dan detail order jika berhasil.
 */
export function useCancelOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: z.infer<typeof cancelOrderSchema>) =>
            cancelOrder(data),
        onSuccess: (res, vars) => {
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
                queryClient.invalidateQueries({
                    queryKey: orderKeys.detail(vars.orderId),
                });
            }
        },
    });
}
