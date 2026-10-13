import { useState } from "react";
import type { CustomerFilters } from "@/features/customers/hooks/useCustomerQueries";
import { useDebounce } from "@/hooks/useDebounce";

/**
 * State input filter customers (search + segment + tier) beserta turunan
 * `params` siap kirim sebagai query server. Filtering di-resolve di server;
 * hook ini hanya memegang state mentah + debounce search.
 */
export const useCustomerFilters = () => {
    const [search, setSearch] = useState("");
    const [segmentFilter, setSegmentFilter] = useState("all");
    const [tierFilter, setTierFilter] = useState("all");

    const debouncedSearch = useDebounce(search);
    const q = debouncedSearch.trim();

    const params: CustomerFilters = {
        ...(q ? { q } : {}),
        ...(segmentFilter !== "all" ? { segment: segmentFilter } : {}),
        ...(tierFilter !== "all" ? { tier: tierFilter } : {}),
    };

    const hasFilters =
        q !== "" || segmentFilter !== "all" || tierFilter !== "all";

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
        params,
        hasFilters,
        clearFilters,
    };
};
