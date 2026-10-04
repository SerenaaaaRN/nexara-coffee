import {
    createColumnHelper,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { RefreshCcw } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TransactionRow } from "@/features/transactions/types";
import { PAYMENT_METHODS } from "@/features/transactions/types";
import { useTableState } from "@/hooks/useTableState";
import { capitalize, formatCurrency, formatDateTime } from "@/utils/format";
import { getBadgeVariant } from "@/utils/status";

const columnHelper = createColumnHelper<TransactionRow>();

const paymentLabels: Record<string, string> = {
    cash: "Cash",
    qris: "QRIS",
    debit: "Debit",
    credit: "Credit",
};

const TRANSACTION_STATUS_OPTIONS = ["completed", "refunded"].map((s) => ({
    value: s,
    label: capitalize(s),
}));

/**
 * Mempersiapkan column definitions, filter configs, useTableState, dan instance useReactTable
 * untuk tabel transaksi. canRefund / onRefund diteruskan ke kolom aksi.
 */
export function useTransactionsTable(
    transactions: TransactionRow[],
    callbacks: {
        canRefund: boolean;
        onRefund: (transactionId: string) => void;
    },
) {
    const tableState = useTableState({ initialPageSize: 10 });

    /** Filter berdasarkan payment method dan status transaksi. */
    const filterConfigs = useMemo(
        () => [
            {
                columnId: "paymentMethod" as const,
                options: PAYMENT_METHODS.map((m) => ({
                    value: m,
                    label: paymentLabels[m],
                })),
                placeholder: "All methods",
            },
            {
                columnId: "status" as const,
                options: TRANSACTION_STATUS_OPTIONS,
                placeholder: "All statuses",
            },
        ],
        [],
    );

    /** Kolom: createdAt, orderNumber, branchName, paymentMethod, amount, status, actions. */
    const columns = useMemo(
        () => [
            columnHelper.accessor("createdAt", {
                header: "Date",
                cell: (info) => formatDateTime(info.getValue()),
                sortingFn: "datetime",
            }),
            columnHelper.accessor((row) => row.orderNumber ?? "—", {
                id: "orderNumber",
                header: "Order",
                cell: (info) => (
                    <span className="font-medium">{info.getValue()}</span>
                ),
            }),
            columnHelper.accessor((row) => row.branchName ?? "—", {
                id: "branchName",
                header: "Branch",
            }),
            columnHelper.accessor("paymentMethod", {
                header: "Method",
                filterFn: (row, _columnId, filterValue) => {
                    if (!filterValue || filterValue === "all") return true;
                    return row.original.paymentMethod === filterValue;
                },
                cell: (info) => (
                    <Badge variant="secondary">
                        {paymentLabels[info.getValue()] ?? info.getValue()}
                    </Badge>
                ),
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
            columnHelper.display({
                id: "actions",
                header: "Actions",
                cell: ({ row }) => {
                    if (
                        callbacks.canRefund &&
                        row.original.status === "completed"
                    ) {
                        return (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() =>
                                    callbacks.onRefund(row.original.id)
                                }>
                                <RefreshCcw data-icon="inline-start" />
                            </Button>
                        );
                    }
                    return null;
                },
            }),
        ],
        [callbacks.canRefund, callbacks.onRefund],
    );

    /**
     * Instance useReactTable.
     * globalFilterFn mencari berdasarkan orderNumber, branchName, paymentMethod.
     */
    const table = useReactTable({
        data: transactions,
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
            const t = row.original;
            return (
                (t.orderNumber ?? "").toLowerCase().includes(searchStr) ||
                (t.branchName ?? "").toLowerCase().includes(searchStr) ||
                (t.paymentMethod ?? "").toLowerCase().includes(searchStr)
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
        searchPlaceholder: "Search by order, branch...",
    };
}
