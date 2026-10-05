import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import type { z } from "zod";
import type {
    cancelOrderSchema,
    createOrderSchema,
    Order,
    updateStatusSchema,
} from "@/features/orders/types";
import { myPortalKeys, orderKeys } from "@/features/query-keys";

function toOrder(r: {
    id: string;
    branch_id: string;
    customer_id: string | null;
    order_number: string;
    status: string;
    total_amount: string;
    created_by: string | null;
    created_at: string;
}): Order {
    return {
        id: r.id,
        branchId: r.branch_id,
        customerId: r.customer_id,
        orderNumber: r.order_number,
        status: r.status,
        totalAmount: r.total_amount,
        createdBy: r.created_by,
        createdAt: r.created_at,
    };
}

/**
 * Membuat order baru berserta item-itemnya.
 * Membutuhkan hak akses RBAC "create" pada "orders".
 *
 * @param d - Objek data pesanan (branch, customer, items)
 * @returns Object response dengan orderId jika sukses
 */
export const createOrderFn = createServerFn({ method: "POST" })
    .validator((d: z.infer<typeof createOrderSchema>) => d)
    .handler(async ({ data: parsed }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("create", "orders");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { getAccessibleBranchIds } = await import("@/utils/branch-scope");
        const ids = await getAccessibleBranchIds(
            auth.session.user.id,
            auth.session.user.role,
        );

        if (ids !== null && !ids.includes(parsed.branchId)) {
            return {
                success: false as const,
                error: "Forbidden branch access",
            };
        }

        const { supabaseAdmin } = await import("@database/server");

        const orderId = crypto.randomUUID();
        const total = parsed.items.reduce(
            (sum, i) => sum + Number(i.price) * i.qty,
            0,
        );
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const orderNumber = `ORD-${dateStr}-${orderId.slice(0, 4).toUpperCase()}`;

        const { error: orderError } = await supabaseAdmin
            .from("orders")
            .insert({
                id: orderId,
                branch_id: parsed.branchId,
                customer_id: parsed.customerId ?? null,
                order_number: orderNumber,
                status: "pending",
                total_amount: String(total),
                created_by: auth.session.user.id,
            });

        if (orderError)
            return { success: false as const, error: orderError.message };

        const { error: itemsError } = await supabaseAdmin
            .from("order_items")
            .insert(
                parsed.items.map((item) => ({
                    id: crypto.randomUUID(),
                    order_id: orderId,
                    menu_item_id: item.menuItemId,
                    name_snapshot: item.variant
                        ? `${item.name} (${item.variant})`
                        : item.name,
                    price_snapshot: String(item.price),
                    variant_snapshot: item.variant ?? null,
                    qty: item.qty,
                    subtotal: String(Number(item.price) * item.qty),
                })),
            );

        if (itemsError)
            return { success: false as const, error: itemsError.message };

        const { getAblyRest } = await import("@/lib/ably.server");
        const ably = getAblyRest();
        ably.channels.get("orders").publish("order-created", { orderId });

        return { success: true as const, data: { id: orderId, orderNumber } };
    });

/**
 * Mengupdate status order (contoh: pending -> preparing -> completed).
 * Membutuhkan hak akses RBAC "update" pada "orders".
 *
 * @param d - Objek data ID pesanan dan status barunya
 * @returns Data pesanan setelah diupdate
 */
export const updateOrderStatusFn = createServerFn({ method: "POST" })
    .validator((d: z.infer<typeof updateStatusSchema>) => d)
    .handler(async ({ data: parsed }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("update", "orders");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { supabaseAdmin } = await import("@database/server");
        const { getAccessibleBranchIds } = await import("@/utils/branch-scope");

        // Jalankan paralel: cek order existing + scope cabang user (independen)
        const [{ data: existing, error: existingError }, ids] =
            await Promise.all([
                supabaseAdmin
                    .from("orders")
                    .select("branch_id, customer_id, status, total_amount")
                    .eq("id", parsed.orderId)
                    .limit(1)
                    .maybeSingle(),
                getAccessibleBranchIds(
                    auth.session.user.id,
                    auth.session.user.role,
                ),
            ]);

        if (existingError || !existing) {
            return {
                success: false as const,
                error: existingError?.message ?? "Order not found",
            };
        }

        if (ids !== null && !ids.includes(existing.branch_id)) {
            return {
                success: false as const,
                error: "Forbidden branch access",
            };
        }

        if (existing.status === "cancelled") {
            return {
                success: false as const,
                error: "Order is already cancelled",
            };
        }

        if (existing.status === "completed") {
            return {
                success: false as const,
                error: "Cannot change a completed order",
            };
        }

        const { data: order, error } = await supabaseAdmin
            .from("orders")
            .update({ status: parsed.status })
            .eq("id", parsed.orderId)
            .select()
            .single();

        if (error || !order)
            return {
                success: false as const,
                error: error?.message ?? "Order tidak ditemukan",
            };

        // Akrual poin loyalty best-effort: hanya saat transisi ke completed
        // dan order tercatat atas profil customer. completed itu terminal
        // (tidak bisa diubah/dibatalkan lagi) jadi tidak ada dobel akrual.
        // Kegagalan akrual tidak menggagalkan update status.
        if (parsed.status === "completed" && existing.customer_id) {
            try {
                const { earnedPointsForTotal, tierForPoints } = await import(
                    "@/features/customers/types"
                );
                const { data: profile } = await supabaseAdmin
                    .from("customers")
                    .select("loyalty_points")
                    .eq("id", existing.customer_id)
                    .limit(1)
                    .maybeSingle();
                if (profile) {
                    const next =
                        (profile.loyalty_points ?? 0) +
                        earnedPointsForTotal(existing.total_amount);
                    await supabaseAdmin
                        .from("customers")
                        .update({
                            loyalty_points: next,
                            loyalty_tier: tierForPoints(next),
                        })
                        .eq("id", existing.customer_id);
                }
            } catch (accrueError) {
                console.error("Gagal akrual poin loyalty:", accrueError);
            }
        }

        const { getAblyRest } = await import("@/lib/ably.server");
        const ably = getAblyRest();
        ably.channels
            .get("orders")
            .publish("order-updated", { orderId: order.id });

        return { success: true as const, data: toOrder(order) };
    });

/**
 * Membatalkan order. Tidak bisa membatalkan order yang sudah 'completed' atau 'cancelled'.
 * Membutuhkan hak akses RBAC "update" pada "orders".
 *
 * @param d - Objek data ID pesanan dan alasan pembatalan
 * @returns Data pesanan setelah dibatalkan
 */
export const cancelOrderFn = createServerFn({ method: "POST" })
    .validator((d: z.infer<typeof cancelOrderSchema>) => d)
    .handler(async ({ data: parsed }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("update", "orders");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { supabaseAdmin } = await import("@database/server");
        const { getAccessibleBranchIds } = await import("@/utils/branch-scope");

        // Jalankan paralel: cek order existing + scope cabang user (independen)
        const [{ data: existing, error: existingError }, ids] =
            await Promise.all([
                supabaseAdmin
                    .from("orders")
                    .select("branch_id, status")
                    .eq("id", parsed.orderId)
                    .limit(1)
                    .maybeSingle(),
                getAccessibleBranchIds(
                    auth.session.user.id,
                    auth.session.user.role,
                ),
            ]);

        if (existingError || !existing) {
            return {
                success: false as const,
                error: existingError?.message ?? "Order not found",
            };
        }

        if (ids !== null && !ids.includes(existing.branch_id)) {
            return {
                success: false as const,
                error: "Forbidden branch access",
            };
        }

        if (existing.status === "completed") {
            return {
                success: false as const,
                error: "Cannot cancel a completed order",
            };
        }

        if (existing.status === "cancelled") {
            return {
                success: false as const,
                error: "Order is already cancelled",
            };
        }

        const { data: order, error } = await supabaseAdmin
            .from("orders")
            .update({ status: "cancelled" })
            .eq("id", parsed.orderId)
            .select()
            .single();

        if (error || !order)
            return {
                success: false as const,
                error: error?.message ?? "Order tidak ditemukan",
            };

        const { getAblyRest } = await import("@/lib/ably.server");
        const ably = getAblyRest();
        ably.channels
            .get("orders")
            .publish("order-cancelled", { orderId: order.id });

        return { success: true as const, data: toOrder(order) };
    });

/**
 * Custom hook untuk mutasi pembuatan order baru.
 * Otomatis memvalidasi ulang query list orders jika berhasil.
 */
export function useCreateOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: z.infer<typeof createOrderSchema>) =>
            createOrderFn({ data }),
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
            updateOrderStatusFn({ data }),
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
            cancelOrderFn({ data }),
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
