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

import { toast } from "sonner";
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
import { useTransactions } from "@/features/transactions/hooks/useTransactionQueries";
import { useConfirmAction } from "@/hooks/useConfirmAction";
import { formatCurrency } from "@/utils/format";
import { useTransactionsTable } from "../hooks/useTransactionsTable";

interface TransactionsTableProps {
    canRefund: boolean;
}

export function TransactionsTable({ canRefund }: TransactionsTableProps) {
    const { data: transactions } = useTransactions();
    const refundMutation = useRefundTransaction();
    const refund = useConfirmAction<string>();

    const { table, tableState, filterConfigs, searchPlaceholder } =
        useTransactionsTable(transactions, {
            canRefund,
            onRefund: (transactionId) => refund.setTarget(transactionId),
        });

    const filteredRows = table.getFilteredRowModel().rows;
    const rows = table.getRowModel().rows;
    const filteredCount = filteredRows.length;
    const pageIndex = tableState.pagination.pageIndex;
    const pageCount = table.getPageCount();

    const totalAmount = filteredRows.reduce(
        (sum, r) => sum + Number(r.original.amount),
        0,
    );
    const completedAmount = filteredRows
        .filter((r) => r.original.status === "completed")
        .reduce((sum, r) => sum + Number(r.original.amount), 0);
    const refundedCount = filteredRows.filter(
        (r) => r.original.status === "refunded",
    ).length;

    async function handleRefund() {
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
    }

    return (
        <div className="flex flex-col gap-4" data-tour="transactions-content">
            {transactions.length === 0 ? (
                <Empty>
                    <EmptyMedia variant="icon">
                        <CreditCard />
                    </EmptyMedia>
                    <EmptyTitle>No transactions yet</EmptyTitle>
                    <EmptyDescription>
                        Transactions will appear here once orders are processed.
                    </EmptyDescription>
                </Empty>
            ) : (
                <>
                    <div
                        className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4"
                        data-tour="transactions-stats">
                        <StatCard
                            label="Total Revenue"
                            value={formatCurrency(totalAmount)}
                            icon={TrendingUp}
                        />
                        <StatCard
                            label="Completed"
                            value={formatCurrency(completedAmount)}
                            icon={TrendingUp}
                        />
                        <StatCard
                            label="Refunded"
                            value={refundedCount}
                            icon={TrendingDown}
                        />
                        <StatCard
                            label="Total Transactions"
                            value={filteredCount}
                            icon={CreditCard}
                        />
                    </div>
                    <div data-tour="transactions-toolbar">
                        <FilterToolbar
                            tableState={tableState}
                            searchPlaceholder={searchPlaceholder}
                            filters={filterConfigs}
                            total={transactions.length}
                            filtered={filteredCount}
                        />
                    </div>

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
                                                {h.column.getCanSort() &&
                                                    (h.column.getIsSorted() ===
                                                    "asc" ? (
                                                        <ArrowUp className="size-3" />
                                                    ) : h.column.getIsSorted() ===
                                                      "desc" ? (
                                                        <ArrowDown className="size-3" />
                                                    ) : (
                                                        <ChevronsUpDown className="size-3 text-muted-foreground" />
                                                    ))}
                                            </div>
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {rows.map((row) => (
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

                    {filteredCount > 0 && (
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Showing {filteredCount} transaction
                                {filteredCount !== 1 ? "s" : ""}
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
                    )}
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
}
