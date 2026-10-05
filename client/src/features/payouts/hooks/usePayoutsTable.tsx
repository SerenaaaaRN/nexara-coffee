import {
    createColumnHelper,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { Check } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PayoutRow } from "@/features/payouts/types";
import { PAYOUT_STATUSES } from "@/features/payouts/types";
import { useTableState } from "@/hooks/useTableState";
import { capitalize, formatCurrency, formatDate } from "@/utils/format";
import { getBadgeVariant } from "@/utils/status";

const columnHelper = createColumnHelper<PayoutRow>();

/**
 * Mempersiapkan column definitions, filter configs, useTableState, dan instance useReactTable
 * untuk tabel payout. canApprove / onApprove diteruskan ke kolom aksi.
 * Kolom `createdAt` disembunyikan secara default via initialState.
 */
export function usePayoutsTable(
    payouts: PayoutRow[],
    callbacks: {
        canApprove: boolean;
        onApprove: (payoutId: string) => void;
    },
) {
    const tableState = useTableState({ initialPageSize: 10 });

    /** Filter berdasarkan status payout (pending/approved/paid). */
    const filterConfigs = useMemo(
        () => [
            {
                columnId: "status" as const,
                options: PAYOUT_STATUSES.map((s) => ({
                    value: s,
                    label: capitalize(s),
                })),
                placeholder: "All statuses",
            },
        ],
        [],
    );

    /**
     * Kolom: createdAt (hidden), period, branchName, franchiseOwnerName, amount, status,
     * approvedByName, actions.
     */
    const columns = useMemo(
        () => [
            columnHelper.accessor("createdAt", {
                header: "Created At",
                cell: (info) => (
                    <span className="hidden">
                        {new Date(info.getValue()).toISOString()}
                    </span>
                ),
                enableSorting: false,
            }),
            columnHelper.display({
                id: "period",
                header: "Period",
                cell: ({ row }) => (
                    <>
                        {formatDate(row.original.periodStart, {
                            day: "numeric",
                            month: "short",
                        })}{" "}
                        –{" "}
                        {formatDate(row.original.periodEnd, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                        })}
                    </>
                ),
            }),
            columnHelper.accessor((row) => row.branchName ?? "—", {
                id: "branchName",
                header: "Branch",
                cell: (info) => (
                    <span className="font-medium">{info.getValue()}</span>
                ),
            }),
            columnHelper.accessor((row) => row.franchiseOwnerName ?? "—", {
                id: "franchiseOwnerName",
                header: "Owner",
            }),
            columnHelper.accessor("amount", {
                header: "Amount",
                cell: (info) => (
                    <span className="font-mono">
                        {formatCurrency(Number(info.getValue()))}
                    </span>
                ),
            }),
            columnHelper.accessor("status", {
                header: "Status",
                filterFn: (row, _columnId, filterValue) => {
                    if (!filterValue || filterValue === "all") return true;
                    return row.original.status === filterValue;
                },
                cell: (info) => (
                    <Badge variant={getBadgeVariant(info.getValue())}>
                        {capitalize(info.getValue())}
                    </Badge>
                ),
            }),
            columnHelper.accessor((row) => row.approvedByName ?? "—", {
                id: "approvedByName",
                header: "Approved By",
            }),
            columnHelper.display({
                id: "actions",
                header: "Actions",
                cell: ({ row }) => {
                    if (
                        callbacks.canApprove &&
                        row.original.status === "pending"
                    ) {
                        return (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-green-600"
                                onClick={() =>
                                    callbacks.onApprove(row.original.id)
                                }>
                                <Check data-icon="inline-start" />
                            </Button>
                        );
                    }
                    return null;
                },
            }),
        ],
        [callbacks.canApprove, callbacks.onApprove],
    );

    /**
     * Instance useReactTable.
     * globalFilterFn mencari berdasarkan branchName dan franchiseOwnerName.
     * Kolom createdAt disembunyikan secara default (hanya dipakai untuk sorting).
     */
    const table = useReactTable({
        data: payouts,
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
            const searchStr = String(filterValue).toLowerCase();
            const p = row.original;
            return (
                (p.branchName ?? "").toLowerCase().includes(searchStr) ||
                (p.franchiseOwnerName ?? "").toLowerCase().includes(searchStr)
            );
        },
        initialState: {
            columnVisibility: {
                createdAt: false,
            },
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
        searchPlaceholder: "Search by branch or owner...",
    };
}
