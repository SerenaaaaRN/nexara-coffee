import {
    createColumnHelper,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { Ban, Check, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KASIR_STATUSES } from "@/features/kasir/data";
import type { SetoranRow } from "@/features/kasir/types";
import { useTableState } from "@/hooks/useTableState";
import { capitalize, formatCurrency, formatDate } from "@/utils/format";
import { getBadgeVariant } from "@/utils/status";

const columnHelper = createColumnHelper<SetoranRow>();

/**
 * Mempersiapkan column definitions, filter configs, useTableState, dan instance useReactTable
 * untuk tabel setoran harian (kasir). canApprove / currentUserId / onApproveReject / onDelete
 * diteruskan ke kolom aksi.
 */
export const useKasirTable = (
    setorans: SetoranRow[],
    callbacks: {
        canApprove: boolean;
        currentUserId: string;
        onApproveReject: (id: string, action: "approve" | "reject") => void;
        onDelete: (id: string) => void;
    },
) => {
    const tableState = useTableState();

    /** Filter berdasarkan status setoran. */
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

    /** Kolom: date, branchId, cashierName, amount, status, actions (approve/reject/delete). */
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
                cell: ({ row }) => (
                    <span className="font-medium">
                        {row.original.branchName ?? "—"}
                    </span>
                ),
                filterFn: (row, _columnId, filterValue) => {
                    if (!filterValue) return true;
                    return row.original.branchId === filterValue;
                },
            }),
            columnHelper.accessor("cashierName", {
                id: "cashierName",
                header: "Cashier",
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
                sortingFn: (rowA, rowB, columnId) =>
                    Number(rowA.getValue(columnId)) -
                    Number(rowB.getValue(columnId)),
            }),
            columnHelper.accessor("status", {
                id: "status",
                header: "Status",
                cell: ({ getValue }) => (
                    <Badge variant={getBadgeVariant(getValue())}>
                        {capitalize(getValue())}
                    </Badge>
                ),
                filterFn: (row, _columnId, filterValue) => {
                    if (!filterValue) return true;
                    return row.original.status === filterValue;
                },
            }),
            columnHelper.display({
                header: "Actions",
                cell: ({ row }) => {
                    const s = row.original;
                    const isOwner = callbacks.currentUserId === s.cashierId;

                    return (
                        <div className="flex items-center gap-1">
                            {callbacks.canApprove && s.status === "pending" && (
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
                            )}
                            {isOwner && s.status === "pending" && (
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
                            )}
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
     * Instance useReactTable.
     * globalFilterFn mencari berdasarkan branchName dan cashierName.
     */
    const table = useReactTable({
        data: setorans,
        columns,
        getRowId: (row) => row.id,
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
        globalFilterFn: (row, _columnId, filterValue) => {
            const q = String(filterValue).toLowerCase();
            const s = row.original;
            return (
                (s.branchName ?? "").toLowerCase().includes(q) ||
                (s.cashierName ?? "").toLowerCase().includes(q)
            );
        },
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    return {
        table,
        tableState,
        filterConfigs,
        searchPlaceholder: "Search by branch or cashier...",
    };
};
