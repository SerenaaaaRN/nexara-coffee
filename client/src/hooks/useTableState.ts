import type {
    ColumnFiltersState,
    PaginationState,
    SortingState,
} from "@tanstack/react-table";
import { useCallback, useState } from "react";

interface UseTableStateOptions {
    initialPageSize?: number;
    initialSorting?: SortingState;
    initialColumnFilters?: ColumnFiltersState;
    initialGlobalFilter?: string;
}

/**
 * State management untuk TanStack Table (sorting + global filter + column filters + pagination).
 * Dipakai bersama FilterToolbar. Tidak ada JSX — pure state hook.
 */
export function useTableState(options?: UseTableStateOptions) {
    const [sorting, setSorting] = useState<SortingState>(
        options?.initialSorting ?? [],
    );

    const [globalFilter, setGlobalFilter] = useState(
        options?.initialGlobalFilter ?? "",
    );

    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
        options?.initialColumnFilters ?? [],
    );

    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: options?.initialPageSize ?? 10,
    });

    /** Ambil value filter column tertentu. */
    const getFilterValue = useCallback(
        (columnId: string) =>
            (columnFilters.find((f) => f.id === columnId)?.value as string) ??
            undefined,
        [columnFilters],
    );

    /** Set/reset filter untuk satu column. Otomatis reset pagination ke halaman 1. */
    const setFilterValue = useCallback(
        (columnId: string, value: string | undefined | null) => {
            setColumnFilters((prev) => {
                const rest = prev.filter((f) => f.id !== columnId);

                if (value === undefined || value === null || value === "") {
                    return rest;
                }
                return [...rest, { id: columnId, value }];
            });
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        },
        [],
    );

    /** Set global search. Otomatis reset pagination ke halaman 1. */
    const handleGlobalFilterChange = useCallback((value: string) => {
        setGlobalFilter(value);
        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, []);

    /** Reset semua state (sort, global filter, column filter, pagination). */
    const clearAll = useCallback(() => {
        setGlobalFilter("");
        setColumnFilters([]);
        setSorting([]);
        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, []);

    return {
        sorting,
        setSorting,
        globalFilter,
        setGlobalFilter: handleGlobalFilterChange,
        columnFilters,
        setColumnFilters,
        pagination,
        setPagination,
        getFilterValue,
        setFilterValue,
        clearAll,
    };
}
