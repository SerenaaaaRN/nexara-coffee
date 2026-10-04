import { useMemo, useState } from "react";
import type { AuditLogRow } from "@/features/audit/types";
import { groupByDate } from "@/utils/group-by";

/**
 * Filter & search audit log di sisi client.
 *
 * Ngatur state pencarian (search), filter aksi (actionFilter), dan filter tabel (tableFilter).
 * Semua derived otomatis: `uniqueTables`, `filtered`, `grouped` (by date).
 *
 * @param logs - Seluruh data audit log (biasanya dari useAuditLogs)
 * @returns State + setter + hasil filter/group
 */
export const useAuditFilters = (logs: AuditLogRow[]) => {
    const [search, setSearch] = useState("");
    const [actionFilter, setActionFilter] = useState("all");
    const [tableFilter, setTableFilter] = useState("all");

    const uniqueTables = useMemo(() => {
        const set = new Set(logs.map((l) => l.targetTable));
        return Array.from(set).sort();
    }, [logs]);

    const searched = useMemo(() => {
        if (!search) return logs;
        const q = search.toLowerCase();
        return logs.filter(
            (l) =>
                (l.actorName ?? "").toLowerCase().includes(q) ||
                (l.branchName ?? "").toLowerCase().includes(q) ||
                l.targetTable.toLowerCase().includes(q) ||
                l.action.toLowerCase().includes(q),
        );
    }, [logs, search]);

    const filtered = useMemo(() => {
        let result = searched;
        if (actionFilter !== "all")
            result = result.filter((l) => l.action === actionFilter);
        if (tableFilter !== "all")
            result = result.filter((l) => l.targetTable === tableFilter);
        return result;
    }, [searched, actionFilter, tableFilter]);

    const grouped = useMemo(() => groupByDate(filtered), [filtered]);

    return {
        search,
        setSearch,
        actionFilter,
        setActionFilter,
        tableFilter,
        setTableFilter,
        uniqueTables,
        filtered,
        grouped,
    };
};
