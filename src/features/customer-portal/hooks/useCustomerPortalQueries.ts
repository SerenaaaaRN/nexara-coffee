import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import type { MyLoyalty, MyOrder } from "@/features/customer-portal/types";
import { myPortalKeys } from "@/features/query-keys";
import { STALE } from "@/features/stale-time";

/**
 * Mengambil riwayat pesanan milik customer yang sedang login.
 *
 * Scope own gabungan (tanpa butuh permission `orders:read` global):
 * - order yang dibuat sendiri (`created_by = session.user.id`), ATAU
 * - order yang dicatat kasir atas profil customer miliknya
 *   (`customer_id` milik baris `customers` dengan `user_id` sendiri).
 * Jadi belanja offline tetap muncul di /my/orders.
 *
 * @returns {MyOrder[]} Daftar pesanan milik sendiri, terbaru dulu
 */
export const getMyOrdersFn = createServerFn({ method: "GET" }).handler(
    async () => {
        const { getSession } = await import("@/lib/with-auth.server");
        const session = await getSession();
        if (!session?.user)
            return { success: false as const, error: "Unauthorized" };

        const { supabaseAdmin } = await import("@database/server");
        const uid = session.user.id;

        const { data: owned, error: ownedError } = await supabaseAdmin
            .from("customers")
            .select("id")
            .eq("user_id", uid);

        if (ownedError)
            return { success: false as const, error: ownedError.message };

        const ownedIds = (owned ?? []).map((c) => c.id);

        let ordersQuery = supabaseAdmin
            .from("orders")
            .select(
                "id, branch_id, customer_id, order_number, status, total_amount, created_at, branches!orders_branch_id_branches_id_fk(id, name)",
            )
            .order("created_at", { ascending: false });

        if (ownedIds.length > 0) {
            ordersQuery = ordersQuery.or(
                `created_by.eq.${uid},customer_id.in.(${ownedIds.join(",")})`,
            );
        } else {
            ordersQuery = ordersQuery.eq("created_by", uid);
        }

        const { data, error } = await ordersQuery;
        if (error) return { success: false as const, error: error.message };

        const orderIds = (data ?? []).map((r) => r.id);
        const reviewed = new Set<string>();
        if (orderIds.length > 0) {
            const { data: reviewRows, error: reviewError } = await supabaseAdmin
                .from("reviews")
                .select("order_id")
                .in("order_id", orderIds);
            if (reviewError)
                return { success: false as const, error: reviewError.message };
            for (const rr of reviewRows ?? []) {
                if (rr.order_id) reviewed.add(rr.order_id);
            }
        }

        const rows: MyOrder[] = (
            (data ?? []) as unknown as {
                id: string;
                branch_id: string;
                customer_id: string | null;
                order_number: string;
                status: string;
                total_amount: string;
                created_at: string;
                branches: { id: string; name: string } | null;
            }[]
        ).map((r) => ({
            id: r.id,
            branchId: r.branch_id,
            branchName: r.branches?.name ?? null,
            orderNumber: r.order_number,
            status: r.status,
            totalAmount: r.total_amount,
            createdAt: r.created_at,
            hasReview: reviewed.has(r.id),
        }));

        return { success: true as const, data: rows };
    },
);

/**
 * Mengambil profil loyalty milik customer yang sedang login.
 *
 * Dicari via `customers.user_id = session.user.id`. Kalau belum punya
 * baris customer, dibuatkan otomatis dengan tier bronze / 0 poin
 * (lazy-create, supaya register tetap ringan).
 *
 * @returns {MyLoyalty} Profil loyalty + jumlah order milik sendiri
 */
export const getMyLoyaltyFn = createServerFn({ method: "GET" }).handler(
    async () => {
        const { getSession } = await import("@/lib/with-auth.server");
        const session = await getSession();
        if (!session?.user)
            return { success: false as const, error: "Unauthorized" };

        const { supabaseAdmin } = await import("@database/server");
        const uid = session.user.id;

        const { data: existing, error: findError } = await supabaseAdmin
            .from("customers")
            .select("id, full_name, segment, loyalty_points, loyalty_tier")
            .eq("user_id", uid)
            .maybeSingle();

        if (findError)
            return { success: false as const, error: findError.message };

        let customer = existing;

        if (!customer) {
            const { data: created, error: createError } = await supabaseAdmin
                .from("customers")
                .insert({
                    id: crypto.randomUUID(),
                    full_name: session.user.name ?? "Customer",
                    email: session.user.email ?? null,
                    segment: "regular",
                    loyalty_points: 0,
                    loyalty_tier: "bronze",
                    user_id: uid,
                })
                .select("id, full_name, segment, loyalty_points, loyalty_tier")
                .single();

            if (createError || !created)
                return {
                    success: false as const,
                    error:
                        createError?.message ?? "Gagal membuat profil member",
                };
            customer = created;
        }

        const { data: ownedIds, error: ownedError } = await supabaseAdmin
            .from("customers")
            .select("id")
            .eq("user_id", uid);

        if (ownedError)
            return { success: false as const, error: ownedError.message };

        const ids = (ownedIds ?? []).map((c) => c.id);
        let countQuery = supabaseAdmin
            .from("orders")
            .select("id", { count: "exact", head: true });

        if (ids.length > 0) {
            countQuery = countQuery.or(
                `created_by.eq.${uid},customer_id.in.(${ids.join(",")})`,
            );
        } else {
            countQuery = countQuery.eq("created_by", uid);
        }

        const { count, error: countError } = await countQuery;

        if (countError)
            return { success: false as const, error: countError.message };

        const data: MyLoyalty = {
            id: customer.id,
            fullName: customer.full_name,
            segment: customer.segment,
            loyaltyPoints: customer.loyalty_points,
            loyaltyTier: customer.loyalty_tier,
            orderCount: count ?? 0,
        };

        return { success: true as const, data };
    },
);

/** @see {@link getMyOrdersFn} */
export const myOrdersOptions = () =>
    queryOptions({
        queryKey: myPortalKeys.orders(),
        queryFn: () => getMyOrdersFn(),
        staleTime: STALE.FREQUENT,
    });

/** @see {@link getMyLoyaltyFn} */
export const myLoyaltyOptions = () =>
    queryOptions({
        queryKey: myPortalKeys.loyalty(),
        queryFn: () => getMyLoyaltyFn(),
        staleTime: STALE.FREQUENT,
    });

/** @see {@link getMyOrdersFn} */
export function useMyOrders() {
    return useSuspenseQuery(myOrdersOptions());
}

/** @see {@link getMyLoyaltyFn} */
export function useMyLoyalty() {
    return useSuspenseQuery(myLoyaltyOptions());
}
