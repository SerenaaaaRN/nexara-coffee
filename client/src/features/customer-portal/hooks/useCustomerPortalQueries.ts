import {
    infiniteQueryOptions,
    queryOptions,
    useSuspenseInfiniteQuery,
    useSuspenseQuery,
} from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type {
    MyLoyalty,
    MyOrder,
    MyOrdersPage,
} from "@/features/customer-portal/types";
import { myPortalKeys } from "@/features/query-keys";
import { STALE } from "@/features/stale-time";

const myOrdersPageSchema = z.object({
    page: z.number().int().min(0).optional(),
    pageSize: z.number().int().min(1).max(50).optional(),
});

/**
 * Mengambil satu halaman riwayat pesanan milik customer yang sedang login.
 *
 * Scope own gabungan (tanpa butuh permission `orders:read` global):
 * - order yang dibuat sendiri (`created_by = session.user.id`), ATAU
 * - order yang dicatat kasir atas profil customer miliknya
 *
 * Offset-based (`.range()`) per `pageSize` — tiap halaman maksimal 20 ID
 * sehingga query `reviews.in(order_id, ...)` tidak meledak jadi URL >8KB
 * (400 Bad Request saat order 700+).
 *
 * @param d - page (0-based) dan pageSize opsional
 * @returns {MyOrdersPage} Baris halaman + nextPage + total + completedTotal
 */
export const getMyOrdersFn = createServerFn({ method: "GET" })
    .validator((d: z.infer<typeof myOrdersPageSchema>) => d)
    .handler(async ({ data: params }) => {
        const { getSession } = await import("@/lib/with-auth.server");
        const session = await getSession();
        if (!session?.user)
            return { success: false as const, error: "Unauthorized" };

        const { supabaseAdmin } = await import("@database/server");
        const uid = session.user.id;
        const page = params.page ?? 0;
        const pageSize = params.pageSize ?? 20;

        const { data: owned, error: ownedError } = await supabaseAdmin
            .from("customers")
            .select("id")
            .eq("user_id", uid);

        if (ownedError)
            return { success: false as const, error: ownedError.message };

        const ownedIds = (owned ?? []).map((c) => c.id);
        const scopeOr =
            ownedIds.length > 0
                ? `created_by.eq.${uid},customer_id.in.(${ownedIds.join(",")})`
                : null;

        let ordersQuery = supabaseAdmin
            .from("orders")
            .select(
                "id, branch_id, customer_id, order_number, status, total_amount, created_at, branches!orders_branch_id_branches_id_fk(id, name)",
            )
            .order("created_at", { ascending: false })
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (scopeOr) ordersQuery = ordersQuery.or(scopeOr);
        else ordersQuery = ordersQuery.eq("created_by", uid);

        const buildCount = (completedOnly: boolean) => {
            let q = supabaseAdmin
                .from("orders")
                .select("id", { count: "exact", head: true });
            if (scopeOr) q = q.or(scopeOr);
            else q = q.eq("created_by", uid);
            if (completedOnly) q = q.eq("status", "completed");
            return q;
        };

        const [ordersRes, totalRes, completedRes] = await Promise.all([
            ordersQuery,
            buildCount(false),
            buildCount(true),
        ]);

        if (ordersRes.error)
            return { success: false as const, error: ordersRes.error.message };
        if (totalRes.error)
            return { success: false as const, error: totalRes.error.message };
        if (completedRes.error)
            return {
                success: false as const,
                error: completedRes.error.message,
            };

        const orderIds = (ordersRes.data ?? []).map((r) => r.id);
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
            (ordersRes.data ?? []) as unknown as {
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

        const data: MyOrdersPage = {
            rows,
            nextPage: rows.length === pageSize ? page + 1 : null,
            total: totalRes.count ?? 0,
            completedTotal: completedRes.count ?? 0,
        };

        return { success: true as const, data };
    });

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
export const myOrdersInfiniteOptions = () =>
    infiniteQueryOptions({
        queryKey: myPortalKeys.orders(),
        queryFn: ({ pageParam }) =>
            getMyOrdersFn({ data: { page: pageParam } }),
        initialPageParam: 0,
        getNextPageParam: (lastPage) =>
            lastPage.success
                ? (lastPage.data.nextPage ?? undefined)
                : undefined,
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
    return useSuspenseInfiniteQuery(myOrdersInfiniteOptions());
}

/** @see {@link getMyLoyaltyFn} */
export function useMyLoyalty() {
    return useSuspenseQuery(myLoyaltyOptions());
}
