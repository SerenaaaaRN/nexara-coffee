import {
    createColumnHelper,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { RefreshCcw } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TransactionRow } from "@/features/transactions/types";
import { PAYMENT_METHODS } from "@/features/transactions/types";
import type { TableState } from "@/hooks/useTableState";
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
 * Tabel transaksi mode server-driven: search/sort/filter/page di-resolve di
 * server. `tableState` dibuat di komponen via `useTableState`.
 */
export const useTransactionsTable = (
    transactions: TransactionRow[],
    options: {
        tableState: TableState;
        pageCount: number;
        callbacks: {
            canRefund: boolean;
            onRefund: (transactionId: string) => void;
        };
    },
) => {
    const { tableState, pageCount, callbacks } = options;

    /** Filter payment method + status — nilainya dikirim sebagai param server. */
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

    /**
     * Kolom: createdAt, orderNumber, branchName, paymentMethod, amount,
     * status, actions. Sort server hanya untuk createdAt/paymentMethod/
     * amount/status (whitelist `TRANSACTION_SORT_COLUMNS` di server).
     */
    const columns = useMemo(
        () => [
            columnHelper.accessor("createdAt", {
                header: "Date",
                cell: (info) => formatDateTime(info.getValue()),
            }),
            columnHelper.accessor((row) => row.orderNumber ?? "—", {
                id: "orderNumber",
                header: "Order",
                enableSorting: false,
                cell: (info) => (
                    <span className="font-medium">{info.getValue()}</span>
                ),
            }),
            columnHelper.accessor((row) => row.branchName ?? "—", {
                id: "branchName",
                header: "Branch",
                enableSorting: false,
            }),
            columnHelper.accessor("paymentMethod", {
                header: "Method",
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
                cell: (info) => (
                    <Badge variant={getBadgeVariant(info.getValue())}>
                        {capitalize(info.getValue())}
                    </Badge>
                ),
            }),
            columnHelper.display({
                id: "actions",
                header: "Actions",
                enableSorting: false,
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
     * Instance useReactTable server-driven: tanpa row model client
     * (tanpa getFiltered/Sorted/PaginationRowModel).
     */
    const table = useReactTable({
        data: transactions,
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
        searchPlaceholder: "Search by order, branch...",
    };
};
