import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import type { CustomerRow } from "@/features/customers/types";
import { customerKeys } from "@/features/query-keys";
import { STALE } from "@/features/stale-time";

/**
 * Mengambil daftar semua customer beserta jumlah order mereka.
 *
 * Data digabung dengan tabel orders untuk menghitung total order per customer.
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
                "id, full_name, email, phone, segment, loyalty_points, loyalty_tier, created_at",
            )
            .order("created_at", { ascending: false });

        if (customerError)
            return { success: false as const, error: customerError.message };

        const customerIds = (customerData ?? []).map((c) => c.id);

        const orderCounts = new Map<string, number>();
        if (customerIds.length > 0) {
            const { data: orderData, error: orderError } = await supabaseAdmin
                .from("orders")
                .select("customer_id")
                .in("customer_id", customerIds);
            if (orderError)
                return { success: false as const, error: orderError.message };
            for (const o of orderData ?? []) {
                if (!o.customer_id) continue;
                orderCounts.set(
                    o.customer_id,
                    (orderCounts.get(o.customer_id) ?? 0) + 1,
                );
            }
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
