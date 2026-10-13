import { getRouteApi } from "@tanstack/react-router";
import { flexRender } from "@tanstack/react-table";
import {
    ArrowDown,
    ArrowUp,
    ChevronLeft,
    ChevronRight,
    ChevronsUpDown,
    CreditCard,
    TrendingDown,
    TrendingUp,
} from "lucide-react";

import { useMemo } from "react";
import { toast } from "sonner";
import { TransactionsSkeleton } from "@/components/fallbacks/dashboard";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { FilterToolbar } from "@/components/shared/filter-toolbar";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import {
    Empty,
    EmptyDescription,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useRefundTransaction } from "@/features/transactions/hooks/useTransactionMutations";
import type {
    TransactionFilters,
    TransactionsTableParams,
} from "@/features/transactions/hooks/useTransactionQueries";
import { useTransactionsTableQuery } from "@/features/transactions/hooks/useTransactionQueries";
import { useConfirmAction } from "@/hooks/useConfirmAction";
import { useTableState } from "@/hooks/useTableState";
import { formatCurrency } from "@/utils/format";
import { useTransactionsTable } from "../hooks/useTransactionsTable";

interface TransactionsTableProps {
    canRefund: boolean;
}

const routeApi = getRouteApi("/_dashboard/transactions");

export const TransactionsTable = ({ canRefund }: TransactionsTableProps) => {
    const search = routeApi.useSearch();
    const tableState = useTableState();
    const refundMutation = useRefundTransaction();
    const refund = useConfirmAction<string>();

    const paymentMethod = tableState.getFilterValue("paymentMethod");
    const status = tableState.getFilterValue("status");

    const queryParams = useMemo(() => {
        const params: TransactionFilters & TransactionsTableParams = {
            branchId: search.branch,
            paymentMethod,
            status,
            pageSize: tableState.pagination.pageSize,
        };
        const q = tableState.debouncedSearch.trim();
        if (q) params.q = q;
        if (tableState.pagination.pageIndex > 0) {
            params.page = tableState.pagination.pageIndex;
        }
        if (tableState.sortBy) {
            params.sortBy = tableState.sortBy;
            params.sortDir = tableState.sortDir ?? "desc";
        }
        return params;
    }, [
        search.branch,
        paymentMethod,
        status,
        tableState.debouncedSearch,
        tableState.pagination.pageIndex,
        tableState.pagination.pageSize,
        tableState.sortBy,
        tableState.sortDir,
    ]);

    const { data: response, isPending } =
        useTransactionsTableQuery(queryParams);

    const payload = response?.success ? response.data : null;
    const rows = payload?.rows ?? [];
    const total = payload?.total ?? 0;
    const summary = payload?.summary ?? {
        total: 0,
        totalAmount: "0",
        completedAmount: "0",
        refundedCount: 0,
    };

    const hasActiveFilter =
        tableState.debouncedSearch.trim() !== "" ||
        paymentMethod !== undefined ||
        status !== undefined ||
        search.branch !== undefined;

    const pageCount = Math.max(
        1,
        Math.ceil(total / tableState.pagination.pageSize),
    );

    const { table, filterConfigs, searchPlaceholder } = useTransactionsTable(
        rows,
        {
            tableState,
            pageCount,
            callbacks: {
                canRefund,
                onRefund: (transactionId) => refund.setTarget(transactionId),
            },
        },
    );

    const tableRows = table.getRowModel().rows;
    const pageIndex = tableState.pagination.pageIndex;

    const handleRefund = async () => {
        if (!refund.target) return;
        const res = await refundMutation
            .mutateAsync({ transactionId: refund.target })
            .catch(() => null);

        if (res?.success) {
            toast.success("Transaction refunded");
        } else {
            toast.error("Failed to refund transaction");
        }
        refund.clearTarget();
    };

    if (isPending && !payload) {
        return <TransactionsSkeleton />;
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard
                    label="Total Revenue"
                    value={formatCurrency(summary.totalAmount)}
                    icon={TrendingUp}
                />
                <StatCard
                    label="Completed"
                    value={formatCurrency(summary.completedAmount)}
                    icon={TrendingUp}
                />
                <StatCard
                    label="Refunded"
                    value={summary.refundedCount}
                    icon={TrendingDown}
                />
                <StatCard
                    label="Total Transactions"
                    value={summary.total}
                    icon={CreditCard}
                />
            </div>
            <FilterToolbar
                tableState={tableState}
                searchPlaceholder={searchPlaceholder}
                filters={filterConfigs}
                total={total}
                filtered={rows.length}
            />

            {rows.length === 0 ? (
                <Empty>
                    <EmptyMedia variant="icon">
                        <CreditCard />
                    </EmptyMedia>
                    <EmptyTitle>
                        {hasActiveFilter
                            ? "No matching transactions"
                            : "No transactions yet"}
                    </EmptyTitle>
                    <EmptyDescription>
                        {hasActiveFilter
                            ? "Try adjusting your search or filters."
                            : "Transactions will appear here once orders are processed."}
                    </EmptyDescription>
                </Empty>
            ) : (
                <>
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((hg) => (
                                <TableRow key={hg.id}>
                                    {hg.headers.map((h) => (
                                        <TableHead
                                            key={h.id}
                                            onClick={h.column.getToggleSortingHandler()}
                                            aria-sort={
                                                h.column.getIsSorted() === "asc"
                                                    ? "ascending"
                                                    : h.column.getIsSorted() ===
                                                        "desc"
                                                      ? "descending"
                                                      : undefined
                                            }>
                                            <div className="flex items-center gap-1">
                                                {h.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                          h.column.columnDef
                                                              .header,
                                                          h.getContext(),
                                                      )}
                                                {h.column.getCanSort() ? (
                                                    h.column.getIsSorted() ===
                                                    "asc" ? (
                                                        <ArrowUp className="size-3" />
                                                    ) : h.column.getIsSorted() ===
                                                      "desc" ? (
                                                        <ArrowDown className="size-3" />
                                                    ) : (
                                                        <ChevronsUpDown className="size-3 text-muted-foreground" />
                                                    )
                                                ) : null}
                                            </div>
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {tableRows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext(),
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Showing {rows.length} of {total} transaction
                            {total !== 1 ? "s" : ""}
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}>
                                <ChevronLeft className="size-4" />
                            </Button>
                            <span className="text-sm text-muted-foreground tabular-nums">
                                {pageIndex + 1} / {pageCount}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}>
                                <ChevronRight className="size-4" />
                            </Button>
                        </div>
                    </div>
                </>
            )}

            <ConfirmDialog
                {...refund.dialogProps}
                title="Refund transaction?"
                description="Are you sure you want to refund this transaction? This action cannot be undone."
                confirmLabel="Refund"
                variant="destructive"
                onConfirm={handleRefund}
            />
        </div>
    );
};
