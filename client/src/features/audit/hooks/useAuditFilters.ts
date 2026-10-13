import { useState } from "react";
import type { AuditLogFilters } from "@/features/audit/hooks/useAuditLogs";
import { useDebounce } from "@/hooks/useDebounce";

/**
 * State input filter audit (search + action + table) beserta turunan
 * `params` siap kirim sebagai query server. Filtering di-resolve di server;
 * hook ini hanya memegang state mentah + debounce search.
 */
export const useAuditFilters = () => {
    const [search, setSearch] = useState("");
    const [actionFilter, setActionFilter] = useState("all");
    const [tableFilter, setTableFilter] = useState("all");

    const debouncedSearch = useDebounce(search);
    const q = debouncedSearch.trim();

    const params: AuditLogFilters = {
        ...(q ? { q } : {}),
        ...(actionFilter !== "all" ? { action: actionFilter } : {}),
        ...(tableFilter !== "all" ? { targetTable: tableFilter } : {}),
    };

    const hasActiveFilter =
        q !== "" || actionFilter !== "all" || tableFilter !== "all";

    return {
        search,
        setSearch,
        actionFilter,
        setActionFilter,
        tableFilter,
        setTableFilter,
        params,
        hasActiveFilter,
    };
};
