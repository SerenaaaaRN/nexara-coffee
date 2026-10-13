import {
    createColumnHelper,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { Check } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PayoutRow } from "@/features/payouts/types";
import { PAYOUT_STATUSES } from "@/features/payouts/types";
import type { TableState } from "@/hooks/useTableState";
import { capitalize, formatCurrency, formatDate } from "@/utils/format";
import { getBadgeVariant } from "@/utils/status";

const columnHelper = createColumnHelper<PayoutRow>();

/**
 * Tabel payout mode server-driven: search/sort/filter/page di-resolve di
 * server. `tableState` dibuat di komponen via `useTableState`.
 * Kolom `createdAt` disembunyikan secara default via initialState.
 */
export const usePayoutsTable = (
    payouts: PayoutRow[],
    options: {
        tableState: TableState;
        pageCount: number;
        callbacks: {
            canApprove: boolean;
            onApprove: (payoutId: string) => void;
        };
    },
) => {
    const { tableState, pageCount, callbacks } = options;

    /** Filter berdasarkan status payout — nilainya dikirim sebagai param server. */
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
     * Kolom: createdAt (hidden), period, branchName, franchiseOwnerName,
     * amount, status, approvedByName, actions. Sort server hanya untuk
     * createdAt/amount/status (whitelist `PAYOUT_SORT_COLUMNS` di server).
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
                enableSorting: false,
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
                enableSorting: false,
                cell: (info) => (
                    <span className="font-medium">{info.getValue()}</span>
                ),
            }),
            columnHelper.accessor((row) => row.franchiseOwnerName ?? "—", {
                id: "franchiseOwnerName",
                header: "Owner",
                enableSorting: false,
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
                cell: (info) => (
                    <Badge variant={getBadgeVariant(info.getValue())}>
                        {capitalize(info.getValue())}
                    </Badge>
                ),
            }),
            columnHelper.accessor((row) => row.approvedByName ?? "—", {
                id: "approvedByName",
                header: "Approved By",
                enableSorting: false,
            }),
            columnHelper.display({
                id: "actions",
                header: "Actions",
                enableSorting: false,
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
     * Instance useReactTable server-driven: tanpa row model client
     * (tanpa getFiltered/Sorted/PaginationRowModel).
     */
    const table = useReactTable({
        data: payouts,
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
        initialState: {
            columnVisibility: {
                createdAt: false,
            },
        },
        getCoreRowModel: getCoreRowModel(),
    });

    return {
        table,
        tableState,
        filterConfigs,
        searchPlaceholder: "Search by branch, owner...",
    };
};
