import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { flexRender } from "@tanstack/react-table";
import {
    ArrowDown,
    ArrowUp,
    ChevronLeft,
    ChevronRight,
    ChevronsUpDown,
    Coffee,
    ListOrdered,
    XCircle,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { SectionHeader } from "@/components/shared/section-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { FilterToolbar } from "@/components/shared/filter-toolbar";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import {
    Empty,
    EmptyContent,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrdersSkeleton } from "@/components/fallbacks/dashboard";
import { OrdersBoard } from "@/features/orders/components/orders-board";
import { OrdersDetailDialog } from "@/features/orders/components/orders-detail-dialog";
import {
    useCancelOrder,
    useUpdateOrderStatus,
} from "@/features/orders/hooks/useOrderMutations";
import type {
    OrdersFilters,
    OrdersTableParams,
} from "@/features/orders/hooks/useOrderQueries";
import { useOrdersTableQuery } from "@/features/orders/hooks/useOrderQueries";
import { useOrdersRealtime } from "@/features/orders/hooks/useOrdersRealtime";
import type { OrderRow, OrderStatus } from "@/features/orders/types";
import { useConfirmAction } from "@/hooks/useConfirmAction";
import { useTableState } from "@/hooks/useTableState";
import { useSession } from "@/lib/auth-client";
import { can, type Role } from "@/lib/rbac";
import { getStatusLabel } from "@/utils/status";
import { useOrdersTable } from "../hooks/useOrdersTable";

const routeApi = getRouteApi("/_dashboard/orders");

const OrdersContent = () => {
    const search = routeApi.useSearch();
    const navigate = useNavigate();
    const { data: session } = useSession();

    const isBoard = (search.view ?? "table") === "board";
    const tableState = useTableState();
    const toolbarStatus = tableState.getFilterValue("status") as
        | OrderStatus
        | undefined;
    const status = search.status ?? toolbarStatus;

    const queryParams = useMemo(() => {
        const params: OrdersFilters & OrdersTableParams = {
            branchId: search.branchId,
            status,
            dateFrom: search.dateFrom,
            dateTo: search.dateTo,
            pageSize: isBoard ? 50 : tableState.pagination.pageSize,
        };
        const q = tableState.debouncedSearch.trim();
        if (q) params.q = q;
        if (!isBoard && tableState.pagination.pageIndex > 0) {
            params.page = tableState.pagination.pageIndex;
        }
        if (tableState.sortBy) {
            params.sortBy = tableState.sortBy;
            params.sortDir = tableState.sortDir ?? "desc";
        }
        return params;
    }, [
        search.branchId,
        status,
        search.dateFrom,
        search.dateTo,
        isBoard,
        tableState.debouncedSearch,
        tableState.pagination.pageIndex,
        tableState.pagination.pageSize,
        tableState.sortBy,
        tableState.sortDir,
    ]);

    const hasActiveFilter =
        tableState.debouncedSearch.trim() !== "" ||
        status !== undefined ||
        search.branchId !== undefined ||
        search.dateFrom !== undefined ||
        search.dateTo !== undefined;

    const { data: response, isPending } = useOrdersTableQuery(queryParams);

    const payload = response?.success ? response.data : null;
    const rows = payload?.rows ?? [];
    const total = payload?.total ?? 0;
    const summary = payload?.summary ?? {
        total: 0,
        pending: 0,
        completed: 0,
        cancelled: 0,
    };
    const loadError = response && !response.success ? response.error : null;
    const [detailTarget, setDetailTarget] = useState<OrderRow | null>(null);

    useOrdersRealtime();

    const {
        target: cancelTarget,
        setTarget: setCancelTarget,
        dialogProps: cancelDialogProps,
    } = useConfirmAction<string>();

    const updateStatusMutation = useUpdateOrderStatus();
    const cancelOrderMutation = useCancelOrder();

    const role = session?.user?.role as Role | undefined;
    const canUpdate = role ? can(role, "update", "orders") : false;

    const onViewChange = (v: "table" | "board") => {
        navigate({ to: ".", search: { ...search, view: v }, replace: true });
    };

    const handleStatusUpdate = useCallback(
        async (orderId: string, newStatus: OrderStatus) => {
            const res = await updateStatusMutation
                .mutateAsync({ orderId, status: newStatus })
                .catch(() => null);
            if (res?.success) {
                toast.success(`Order updated to ${getStatusLabel(newStatus)}`);
            } else {
                toast.error("Failed to update order status");
            }
        },
        [updateStatusMutation],
    );

    const handleCancel = async () => {
        if (!cancelTarget) return;
        const res = await cancelOrderMutation
            .mutateAsync({ orderId: cancelTarget })
            .catch(() => null);
        if (res?.success) {
            toast.success("Order cancelled");
        } else {
            toast.error(
                typeof res?.error === "string"
                    ? res.error
                    : "Failed to cancel order",
            );
        }
        setCancelTarget(null);
    };

    const effectivePageSize = isBoard ? 50 : tableState.pagination.pageSize;
    const pageCount = Math.max(1, Math.ceil(total / effectivePageSize));

    const { table, filterConfigs, searchPlaceholder } = useOrdersTable(rows, {
        tableState,
        pageCount,
        callbacks: {
            canUpdate,
            onStatusChange: handleStatusUpdate,
            onCancel: setCancelTarget,
        },
    });

    const tableRows = table.getRowModel().rows;
    const boardRows = tableRows.map((r) => r.original);
    const pageIndex = tableState.pagination.pageIndex;

    if (isPending && !payload) {
        return <OrdersSkeleton />;
    }

    return (
        <div className="flex flex-col gap-4">
            {loadError ? (
                <Empty>
                    <EmptyMedia variant="icon">
                        <XCircle />
                    </EmptyMedia>
                    <EmptyTitle>Gagal memuat orders</EmptyTitle>
                    <EmptyDescription>{loadError}</EmptyDescription>
                    <EmptyContent>
                        <Button
                            variant="outline"
                            onClick={() => window.location.reload()}>
                            Coba lagi
                        </Button>
                    </EmptyContent>
                </Empty>
            ) : (
                <>
                    <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4">
                        <StatCard
                            label="Total Orders"
                            value={summary.total}
                            icon={ListOrdered}
                        />
                        <StatCard
                            label="Pending"
                            value={summary.pending}
                            icon={Coffee}
                        />
                        <StatCard
                            label="Completed"
                            value={summary.completed}
                            icon={Coffee}
                        />
                        <StatCard
                            label="Cancelled"
                            value={summary.cancelled}
                            icon={XCircle}
                        />
                    </div>

                    <div>
                        <FilterToolbar
                            tableState={tableState}
                            searchPlaceholder={searchPlaceholder}
                            filters={filterConfigs}
                            total={total}
                            filtered={rows.length}>
                            <Tabs
                                value={search.view ?? "table"}
                                onValueChange={(v) =>
                                    onViewChange(v as "table" | "board")
                                }>
                                <TabsList>
                                    <TabsTrigger value="table">
                                        Table
                                    </TabsTrigger>
                                    <TabsTrigger value="board">
                                        Board
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </FilterToolbar>
                    </div>

                    {rows.length === 0 ? (
                        <Empty>
                            <EmptyMedia variant="icon">
                                <Coffee />
                            </EmptyMedia>
                            <EmptyTitle>
                                {hasActiveFilter
                                    ? "No matching orders"
                                    : "No orders yet"}
                            </EmptyTitle>
                            <EmptyDescription>
                                {hasActiveFilter
                                    ? "Try adjusting your search or filters."
                                    : "Orders will appear here once customers place them."}
                            </EmptyDescription>
                        </Empty>
                    ) : (search.view ?? "table") === "table" ? (
                        <div className="flex flex-col gap-4">
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
                                                    <div className="flex items-center gap-1 cursor-pointer select-none hover:text-foreground">
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
                                                                <ChevronsUpDown className="size-3 text-muted-foreground opacity-50" />
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
                                        <TableRow
                                            key={row.id}
                                            className="cursor-pointer"
                                            onClick={() =>
                                                setDetailTarget(row.original)
                                            }>
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
                            <div className="flex items-center justify-between mt-2">
                                <p className="text-sm text-muted-foreground">
                                    Showing {rows.length} of {total} order
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
                        </div>
                    ) : (
                        <OrdersBoard
                            orders={boardRows}
                            canUpdate={canUpdate}
                            onSelectOrder={setDetailTarget}
                        />
                    )}
                </>
            )}

            <OrdersDetailDialog
                order={detailTarget}
                open={!!detailTarget}
                onOpenChange={(open) => {
                    if (!open) setDetailTarget(null);
                }}
                canUpdate={canUpdate}
            />

            <ConfirmDialog
                {...cancelDialogProps}
                title="Cancel order?"
                description="Are you sure you want to cancel this order? This action cannot be undone."
                confirmLabel="Cancel Order"
                variant="destructive"
                onConfirm={handleCancel}
            />
        </div>
    );
};

export const OrdersPage = () => {
    return (
        <div className="space-y-6">
            <SectionHeader
                title="Orders"
                subtitle="View and manage orders across branches."
            />
            <OrdersContent />
        </div>
    );
};
