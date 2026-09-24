import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import type { CustomerRow } from "@/features/customers/types";
import { customerKeys } from "@/features/query-keys";
import { STALE } from "@/features/stale-time";

/**
 * Mengambil daftar semua customer beserta jumlah order mereka.
 *
 * Count dikerjakan di database via `get_customer_order_counts`
 * (database/migrations/0003_customer_order_counts.sql) — 1x rpc call.
 * Fetch `orders.customer_id` + count di JS TIDAK dipakai lagi karena kena
 * cap 1000 rows PostgREST (count kepotong saat orders > 1000) dan URL
 * `.in()` yang meledak saat customers > ~100.
 * Diurutkan berdasarkan tanggal dibuat (terbaru dulu).
 *
 * @returns {CustomerRow[]} Daftar customer dengan informasi order
 */
export const getCustomersFn = createServerFn({ method: "GET" }).handler(
    async () => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("read", "customers");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { supabaseAdmin } = await import("@database/server");

        const { data: customerData, error: customerError } = await supabaseAdmin
            .from("customers")
            .select(
                "id, full_name, email, phone, segment, loyalty_points, loyalty_tier, created_at, user_id",
            )
            .order("created_at", { ascending: false });

        if (customerError)
            return { success: false as const, error: customerError.message };

        const orderCounts = new Map<string, number>();
        const { data: countRows, error: countError } = await supabaseAdmin.rpc(
            "get_customer_order_counts",
        );
        if (countError)
            return { success: false as const, error: countError.message };
        for (const r of countRows ?? []) {
            if (!r.customer_id) continue;
            orderCounts.set(r.customer_id, Number(r.order_count));
        }

        const rows: CustomerRow[] = (customerData ?? []).map((c) => ({
            id: c.id,
            fullName: c.full_name,
            email: c.email,
            phone: c.phone,
            segment: c.segment,
            loyaltyPoints: c.loyalty_points,
            loyaltyTier: c.loyalty_tier,
            createdAt: c.created_at,
            orderCount: orderCounts.get(c.id) ?? 0,
            userId: c.user_id,
        }));

        return { success: true as const, data: rows };
    },
);

/** @see {@link getCustomersFn} */
export const customersOptions = () =>
    queryOptions({
        queryKey: customerKeys.lists(),
        queryFn: () => getCustomersFn(),
        staleTime: STALE.FREQUENT,
    });

/** @see {@link getCustomersFn} */
export const useCustomers = () => useSuspenseQuery(customersOptions());
