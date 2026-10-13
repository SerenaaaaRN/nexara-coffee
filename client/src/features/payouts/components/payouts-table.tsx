import { getRouteApi } from "@tanstack/react-router";
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

import { useMemo } from "react";
import { toast } from "sonner";
import { PayoutsSkeleton } from "@/components/fallbacks/dashboard";
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
import type {
    PayoutFilters,
    PayoutsTableParams,
} from "@/features/payouts/hooks/usePayoutQueries";
import { usePayoutsTableQuery } from "@/features/payouts/hooks/usePayoutQueries";
import { useConfirmAction } from "@/hooks/useConfirmAction";
import { useTableState } from "@/hooks/useTableState";
import { formatCurrency } from "@/utils/format";
import { usePayoutsTable } from "../hooks/usePayoutsTable";

interface PayoutsTableProps {
    canApprove: boolean;
}

const routeApi = getRouteApi("/_dashboard/payouts");

export const PayoutsTable = ({ canApprove }: PayoutsTableProps) => {
    const search = routeApi.useSearch();
    const tableState = useTableState();
    const approveMutation = useApprovePayout();
    const approve = useConfirmAction<string>();

    const status = tableState.getFilterValue("status");

    const queryParams = useMemo(() => {
        const params: PayoutFilters & PayoutsTableParams = {
            branchId: search.branch,
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
        status,
        tableState.debouncedSearch,
        tableState.pagination.pageIndex,
        tableState.pagination.pageSize,
        tableState.sortBy,
        tableState.sortDir,
    ]);

    const { data: response, isPending } = usePayoutsTableQuery(queryParams);

    const payload = response?.success ? response.data : null;
    const rows = payload?.rows ?? [];
    const total = payload?.total ?? 0;
    const summary = payload?.summary ?? {
        total: 0,
        totalAmount: "0",
        approvedAmount: "0",
        pendingCount: 0,
    };
    const loadError = response && !response.success ? response.error : null;

    const hasActiveFilter =
        tableState.debouncedSearch.trim() !== "" ||
        status !== undefined ||
        search.branch !== undefined;

    const pageCount = Math.max(
        1,
        Math.ceil(total / tableState.pagination.pageSize),
    );

    const { table, filterConfigs, searchPlaceholder } = usePayoutsTable(rows, {
        tableState,
        pageCount,
        callbacks: {
            canApprove,
            onApprove: (payoutId) => approve.setTarget(payoutId),
        },
    });

    const tableRows = table.getRowModel().rows;
    const pageIndex = tableState.pagination.pageIndex;

    const handleApprove = async () => {
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
    };

    if (isPending && !payload && !loadError) {
        return <PayoutsSkeleton />;
    }

    return (
        <div className="flex flex-col gap-4">
            {loadError ? (
                <Empty>
                    <EmptyMedia variant="icon">
                        <CircleDollarSign />
                    </EmptyMedia>
                    <EmptyTitle>Failed to load payouts</EmptyTitle>
                    <EmptyDescription>{loadError}</EmptyDescription>
                </Empty>
            ) : (
                <>
                    <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4">
                        <StatCard
                            label="Total Requested"
                            value={formatCurrency(summary.totalAmount)}
                            icon={HandCoins}
                        />
                        <StatCard
                            label="Approved"
                            value={formatCurrency(summary.approvedAmount)}
                            icon={Check}
                        />
                        <StatCard
                            label="Pending Requests"
                            value={summary.pendingCount}
                        />
                        <StatCard
                            label="Total"
                            value={summary.total}
                            icon={CircleDollarSign}
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
                                <CircleDollarSign />
                            </EmptyMedia>
                            <EmptyTitle>
                                {hasActiveFilter
                                    ? "No matching payouts"
                                    : "No payouts yet"}
                            </EmptyTitle>
                            <EmptyDescription>
                                {hasActiveFilter
                                    ? "Try adjusting your search or filters."
                                    : "Payout requests will appear here once franchise owners submit them."}
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
                                                        h.column.getIsSorted() ===
                                                        "asc"
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
                                                                  h.column
                                                                      .columnDef
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
                                            {row
                                                .getVisibleCells()
                                                .map((cell) => (
                                                    <TableCell key={cell.id}>
                                                        {flexRender(
                                                            cell.column
                                                                .columnDef.cell,
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
                                    Showing {rows.length} of {total} payout
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
};
