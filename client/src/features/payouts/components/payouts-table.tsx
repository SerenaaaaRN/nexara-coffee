import { flexRender } from "@tanstack/react-table";
import {
    ArrowDown,
    ArrowUp,
    Check,
    ChevronLeft,
    ChevronRight,
    ChevronsUpDown,
    CircleDollarSign,
    HandCoins,
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
import { useApprovePayout } from "@/features/payouts/hooks/usePayoutMutations";
import { usePayouts } from "@/features/payouts/hooks/usePayoutQueries";
import { useConfirmAction } from "@/hooks/useConfirmAction";
import { formatCurrency } from "@/utils/format";
import { usePayoutsTable } from "../hooks/usePayoutsTable";

interface PayoutsTableProps {
    canApprove: boolean;
}

export function PayoutsTable({ canApprove }: PayoutsTableProps) {
    const { data: allPayouts } = usePayouts();
    const approveMutation = useApprovePayout();
    const approve = useConfirmAction<string>();

    const { table, tableState, filterConfigs, searchPlaceholder } =
        usePayoutsTable(allPayouts, {
            canApprove,
            onApprove: (payoutId) => approve.setTarget(payoutId),
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
    const approvedAmount = filteredRows
        .filter((r) => r.original.status === "approved")
        .reduce((sum, r) => sum + Number(r.original.amount), 0);
    const pendingCount = filteredRows.filter(
        (r) => r.original.status === "pending",
    ).length;

    async function handleApprove() {
        if (!approve.target) return;
        const res = await approveMutation
            .mutateAsync({ payoutId: approve.target })
            .catch(() => null);

        if (res?.success) {
            toast.success("Payout approved");
        } else {
            toast.error("Failed to approve payout");
        }
        approve.clearTarget();
    }

    return (
        <div className="flex flex-col gap-4">
            {allPayouts.length === 0 ? (
                <Empty>
                    <EmptyMedia variant="icon">
                        <CircleDollarSign />
                    </EmptyMedia>
                    <EmptyTitle>No payouts yet</EmptyTitle>
                    <EmptyDescription>
                        Payout requests will appear here once franchise owners
                        submit them.
                    </EmptyDescription>
                </Empty>
            ) : (
                <>
                    <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4">
                        <StatCard
                            label="Total Requested"
                            value={formatCurrency(totalAmount)}
                            icon={HandCoins}
                        />
                        <StatCard
                            label="Approved"
                            value={formatCurrency(approvedAmount)}
                            icon={Check}
                        />
                        <StatCard
                            label="Pending Requests"
                            value={pendingCount}
                        />
                        <StatCard
                            label="Total"
                            value={filteredCount}
                            icon={CircleDollarSign}
                        />
                    </div>

                    <FilterToolbar
                        tableState={tableState}
                        searchPlaceholder={searchPlaceholder}
                        filters={filterConfigs}
                        total={allPayouts.length}
                        filtered={filteredCount}
                    />

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
                                Showing {filteredCount} payout
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
                {...approve.dialogProps}
                title="Approve payout?"
                description="Are you sure you want to approve this payout request?"
                confirmLabel="Approve"
                onConfirm={handleApprove}
            />
        </div>
    );
}
