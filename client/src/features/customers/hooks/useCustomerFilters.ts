import { useMemo, useState } from "react";
import type { CustomerRow } from "@/features/customers/types";

/**
 * Filter & search customer di sisi client.
 *
 * Ngatur state pencarian, filter segment, dan filter loyalty tier.
 * Derived: `filtered`, `hasFilters`, `totalOrders`, `totalPoints`.
 *
 * @param customers - Seluruh data customer (biasanya dari useCustomers)
 * @returns State, setter, hasil filter, dan agregat
 */
export const useCustomerFilters = (customers: CustomerRow[]) => {
    const [search, setSearch] = useState("");
    const [segmentFilter, setSegmentFilter] = useState("all");
    const [tierFilter, setTierFilter] = useState("all");

    const searched = useMemo(() => {
        if (!search) return customers;
        const q = search.toLowerCase();
        return customers.filter(
            (c) =>
                c.fullName.toLowerCase().includes(q) ||
                (c.email ?? "").toLowerCase().includes(q) ||
                (c.phone ?? "").toLowerCase().includes(q),
        );
    }, [customers, search]);

    const filtered = useMemo(() => {
        let result = searched;
        if (segmentFilter !== "all")
            result = result.filter((c) => c.segment === segmentFilter);
        if (tierFilter !== "all")
            result = result.filter((c) => c.loyaltyTier === tierFilter);
        return result;
    }, [searched, segmentFilter, tierFilter]);

    const hasFilters =
        segmentFilter !== "all" || tierFilter !== "all" || Boolean(search);

    const totalOrders = useMemo(
        () => filtered.reduce((sum, c) => sum + c.orderCount, 0),
        [filtered],
    );

    const totalPoints = useMemo(
        () => filtered.reduce((sum, c) => sum + c.loyaltyPoints, 0),
        [filtered],
    );

    const clearFilters = () => {
        setSearch("");
        setSegmentFilter("all");
        setTierFilter("all");
    };

    return {
        search,
        setSearch,
        segmentFilter,
        setSegmentFilter,
        tierFilter,
        setTierFilter,
        filtered,
        hasFilters,
        totalOrders,
        totalPoints,
        clearFilters,
    };
};
