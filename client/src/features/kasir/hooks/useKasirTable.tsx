import {
    createColumnHelper,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { Ban, Check, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KASIR_STATUSES } from "@/features/kasir/data";
import type { SetoranRow } from "@/features/kasir/types";
import type { TableState } from "@/hooks/useTableState";
import { capitalize, formatCurrency, formatDate } from "@/utils/format";
import { getBadgeVariant } from "@/utils/status";

const columnHelper = createColumnHelper<SetoranRow>();

/**
 * Tabel setoran harian (kasir) mode server-driven: search/sort/filter/page
 * di-resolve di server. `tableState` dibuat di page via `useTableState`.
 */
export const useKasirTable = (
    setorans: SetoranRow[],
    options: {
        tableState: TableState;
        pageCount: number;
        callbacks: {
            canApprove: boolean;
            currentUserId: string;
            onApproveReject: (id: string, action: "approve" | "reject") => void;
            onDelete: (id: string) => void;
        };
    },
) => {
    const { tableState, pageCount, callbacks } = options;

    /** Filter berdasarkan status setoran — nilainya dikirim sebagai param server. */
    const filterConfigs = useMemo(
        () => [
            {
                columnId: "status" as const,
                options: KASIR_STATUSES.map((s) => ({
                    value: s,
                    label: capitalize(s),
                })),
                placeholder: "All statuses",
            },
        ],
        [],
    );

    /**
     * Kolom: date, branchId, cashierName, amount, status, actions.
     * Sort server hanya untuk date/amount/status (whitelist
     * `SETORAN_SORT_COLUMNS` di server).
     */
    const columns = useMemo(
        () => [
            columnHelper.accessor("date", {
                id: "date",
                header: "Date",
                cell: ({ getValue }) => formatDate(getValue()),
            }),
            columnHelper.accessor("branchId", {
                id: "branchId",
                header: "Branch",
                enableSorting: false,
                cell: ({ row }) => (
                    <span className="font-medium">
                        {row.original.branchName ?? "—"}
                    </span>
                ),
            }),
            columnHelper.accessor("cashierName", {
                id: "cashierName",
                header: "Cashier",
                enableSorting: false,
                cell: ({ getValue }) => getValue() ?? "—",
            }),
            columnHelper.accessor("amount", {
                id: "amount",
                header: "Amount",
                cell: ({ getValue }) => (
                    <span className="font-mono">
                        {formatCurrency(getValue())}
                    </span>
                ),
            }),
            columnHelper.accessor("status", {
                id: "status",
                header: "Status",
                cell: ({ getValue }) => (
                    <Badge variant={getBadgeVariant(getValue())}>
                        {capitalize(getValue())}
                    </Badge>
                ),
            }),
            columnHelper.display({
                id: "actions",
                header: "Actions",
                enableSorting: false,
                cell: ({ row }) => {
                    const s = row.original;
                    const isOwner = callbacks.currentUserId === s.cashierId;

                    return (
                        <div className="flex items-center gap-1">
                            {callbacks.canApprove && s.status === "pending" ? (
                                <>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            callbacks.onApproveReject(
                                                s.id,
                                                "approve",
                                            );
                                        }}>
                                        <Check />
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            callbacks.onApproveReject(
                                                s.id,
                                                "reject",
                                            );
                                        }}>
                                        <Ban />
                                    </Button>
                                </>
                            ) : null}
                            {isOwner && s.status === "pending" ? (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        callbacks.onDelete(s.id);
                                    }}>
                                    <Trash2 />
                                </Button>
                            ) : null}
                        </div>
                    );
                },
            }),
        ],
        [
            callbacks.canApprove,
            callbacks.currentUserId,
            callbacks.onApproveReject,
            callbacks.onDelete,
        ],
    );

    /**
     * Instance useReactTable server-driven: tanpa row model client
     * (tanpa getFiltered/Sorted/PaginationRowModel).
     */
    const table = useReactTable({
        data: setorans,
        columns,
        getRowId: (row) => row.id,
        manualSorting: true,
        manualFiltering: true,
        manualPagination: true,
        pageCount,
        state: {
            sorting: tableState.sorting,
            globalFilter: tableState.globalFilter,
            columnFilters: tableState.columnFilters,
            pagination: tableState.pagination,
        },
        onSortingChange: tableState.setSorting,
        onGlobalFilterChange: tableState.setGlobalFilter,
        onColumnFiltersChange: tableState.setColumnFilters,
        onPaginationChange: tableState.setPagination,
        getCoreRowModel: getCoreRowModel(),
    });

    return {
        table,
        tableState,
        filterConfigs,
        searchPlaceholder: "Search by branch, cashier...",
    };
};
