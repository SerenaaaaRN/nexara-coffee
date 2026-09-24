import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ORDER_STATUSES } from "@/features/orders/data";
import type {
    OrderDetail,
    OrderItem,
    OrderItemJoined,
    OrderJoined,
    OrderRow,
} from "@/features/orders/types";
import { orderKeys } from "@/features/query-keys";

const getOrdersSchema = z.object({
    branchId: z.string().optional(),
    status: z.enum(ORDER_STATUSES).optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
});

const ORDER_SELECT =
    "id, branch_id, customer_id, order_number, status, total_amount, created_by, created_at, branches!orders_branch_id_branches_id_fk(id, name), customers!orders_customer_id_customers_id_fk(id, full_name), created_by_user:user!orders_created_by_user_id_fk(id, name)";

function toOrderRow(r: OrderJoined): OrderRow {
    return {
        id: r.id,
        branchId: r.branch_id,
        customerId: r.customer_id,
        orderNumber: r.order_number,
        status: r.status,
        totalAmount: r.total_amount,
        createdBy: r.created_by,
        createdAt: r.created_at,
        branchName: r.branches?.name ?? null,
        customerName: r.customers?.full_name ?? null,
        createdByName: r.created_by_user?.name ?? null,
    };
}

/**
 * Mengambil daftar order dengan filter branch, status, dan rentang tanggal.
 * Menggunakan server function dengan akses RBAC "read" pada "orders".
 *
 * @param d - Objek parameter getOrdersSchema
 * @returns Daftar order yang difilter sesuai scope cabang
 */
export const getOrdersFn = createServerFn({ method: "GET" })
    .validator((d: z.infer<typeof getOrdersSchema>) => d)
    .handler(async ({ data: params }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("read", "orders");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { supabaseAdmin } = await import("@database/server");
        const { getAccessibleBranchIds } = await import("@/utils/branch-scope");

        const ids = await getAccessibleBranchIds(
            auth.session.user.id,
            auth.session.user.role,
        );

        if (ids !== null && ids.length === 0) {
            return { success: true as const, data: [] satisfies OrderRow[] };
        }

        if (params.branchId) {
            // Pastikan branchId valid (berada di dalam scope)
            if (ids !== null && !ids.includes(params.branchId)) {
                return {
                    success: true as const,
                    data: [] satisfies OrderRow[],
                };
            }
        }

        let ordersQuery = supabaseAdmin
            .from("orders")
            .select(ORDER_SELECT)
            .order("created_at", { ascending: false });

        if (params.branchId) {
            ordersQuery = ordersQuery.eq("branch_id", params.branchId);
        } else if (ids !== null && ids.length > 0) {
            ordersQuery = ordersQuery.in("branch_id", ids);
        }
        if (params.status)
            ordersQuery = ordersQuery.eq("status", params.status);
        if (params.dateFrom)
            ordersQuery = ordersQuery.gte(
                "created_at",
                new Date(params.dateFrom).toISOString(),
            );
        if (params.dateTo)
            ordersQuery = ordersQuery.lte(
                "created_at",
                new Date(params.dateTo).toISOString(),
            );

        const { data, error } = await ordersQuery;
        if (error) return { success: false as const, error: error.message };

        const rows: OrderRow[] = ((data ?? []) as unknown as OrderJoined[]).map(
            toOrderRow,
        );
        return { success: true as const, data: rows satisfies OrderRow[] };
    });

/**
 * Mengambil detail order beserta daftar item-nya.
 * Membutuhkan validasi akses branch dari pengguna yang request.
 *
 * @param id - ID string dari order yang akan diambil detailnya
 * @returns Data order lengkap dengan items, atau error jika tidak ditemukan/dilarang
 */
export const getOrderDetailFn = createServerFn({ method: "GET" })
    .validator((id: string) => id)
    .handler(async ({ data: orderId }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("read", "orders");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { supabaseAdmin } = await import("@database/server");
        const { getAccessibleBranchIds } = await import("@/utils/branch-scope");

        const { data: orderData, error: orderError } = await supabaseAdmin
            .from("orders")
            .select(ORDER_SELECT)
            .eq("id", orderId)
            .maybeSingle();

        if (orderError || !orderData) {
            return {
                success: false as const,
                error: orderError?.message ?? "Order not found",
            };
        }

        const order = toOrderRow(orderData as unknown as OrderJoined);

        const ids = await getAccessibleBranchIds(
            auth.session.user.id,
            auth.session.user.role,
        );

        if (ids !== null && !ids.includes(order.branchId)) {
            return {
                success: false as const,
                error: "Forbidden branch access",
            };
        }

        const { data: itemsData, error: itemsError } = await supabaseAdmin
            .from("order_items")
            .select(
                "id, order_id, menu_item_id, name_snapshot, price_snapshot, variant_snapshot, qty, subtotal, menu_items!order_items_menu_item_id_menu_items_id_fk(id, name)",
            )
            .eq("order_id", orderId);

        if (itemsError)
            return { success: false as const, error: itemsError.message };

        const items: OrderDetail["items"] = (
            (itemsData ?? []) as unknown as OrderItemJoined[]
        ).map((i) => {
            const item: OrderItem = {
                id: i.id,
                orderId: i.order_id,
                menuItemId: i.menu_item_id,
                nameSnapshot: i.name_snapshot,
                priceSnapshot: i.price_snapshot,
                variantSnapshot: i.variant_snapshot,
                qty: i.qty,
                subtotal: i.subtotal,
            };
            return { ...item, menuItemName: i.menu_items?.name ?? null };
        });

        return { success: true as const, data: { ...order, items } };
    });

/**
 * Query options provider untuk list orders.
 *
 * @param params - Parameter filter pencarian orders
 */
export const ordersOptions = (params: z.infer<typeof getOrdersSchema>) =>
    queryOptions({
        queryKey: orderKeys.list(params),
        queryFn: () => getOrdersFn({ data: params }),
        staleTime: 0,
    });

/**
 * Query options provider untuk detail order.
 *
 * @param id - ID order
 */
export const orderDetailOptions = (id: string) =>
    queryOptions({
        queryKey: orderKeys.detail(id),
        queryFn: () => getOrderDetailFn({ data: id }),
        staleTime: 0,
    });

/**
 * Custom hook untuk mengambil data list order dengan suspense.
 *
 * @param params - Parameter pencarian/filter
 */
export function useOrders(params: z.infer<typeof getOrdersSchema>) {
    return useSuspenseQuery(ordersOptions(params));
}

/**
 * Custom hook untuk mengambil detail order dengan suspense.
 *
 * @param id - ID order target
 */
export function useOrderDetail(id: string) {
    return useSuspenseQuery(orderDetailOptions(id));
}
