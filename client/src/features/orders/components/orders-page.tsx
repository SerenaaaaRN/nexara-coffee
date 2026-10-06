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
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { SectionHeader } from "#/components/shared/section-header";
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
import { OrdersBoard } from "@/features/orders/components/orders-board";
import { OrdersDetailDialog } from "@/features/orders/components/orders-detail-dialog";
import {
    useCancelOrder,
    useUpdateOrderStatus,
} from "@/features/orders/hooks/useOrderMutations";
import { useOrders } from "@/features/orders/hooks/useOrderQueries";
import { useOrdersRealtime } from "@/features/orders/hooks/useOrdersRealtime";
import type { OrderRow, OrderStatus } from "@/features/orders/types";
import { useConfirmAction } from "@/hooks/useConfirmAction";
import { useSession } from "@/lib/auth-client";
import { can, type Role } from "@/lib/rbac";
import { getStatusLabel } from "@/utils/status";
import { useOrdersTable } from "../hooks/useOrdersTable";

const routeApi = getRouteApi("/_dashboard/orders");

function OrdersContent() {
    const search = routeApi.useSearch();
    const navigate = useNavigate();
    const { data: session } = useSession();
    const { data: response } = useOrders({
        branchId: search.branchId,
        status: search.status,
        dateFrom: search.dateFrom,
        dateTo: search.dateTo,
    });

    const orders = response.success ? response.data : [];
    const loadError = response.success ? null : response.error;
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

    function onViewChange(v: "table" | "board") {
        navigate({ to: ".", search: { ...search, view: v }, replace: true });
    }

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

    async function handleCancel() {
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
    }

    const { table, tableState, filterConfigs, searchPlaceholder } =
        useOrdersTable(orders, {
            canUpdate,
            onStatusChange: handleStatusUpdate,
            onCancel: setCancelTarget,
        });

    const rows = table.getRowModel().rows;
    const filteredRows = table
        .getFilteredRowModel()
        .rows.map((r) => r.original);
    const filteredCount = filteredRows.length;
    const pageIndex = tableState.pagination.pageIndex;
    const pageCount = table.getPageCount();

    let pendingCount = 0;
    let completedCount = 0;
    let cancelledCount = 0;
    for (const o of filteredRows) {
        if (o.status === "pending") pendingCount += 1;
        else if (o.status === "completed") completedCount += 1;
        else if (o.status === "cancelled") cancelledCount += 1;
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
            ) : orders.length === 0 ? (
                <Empty>
                    <EmptyMedia variant="icon">
                        <Coffee />
                    </EmptyMedia>
                    <EmptyTitle>No orders yet</EmptyTitle>
                    <EmptyDescription>
                        Orders will appear here once customers place them.
                    </EmptyDescription>
                </Empty>
            ) : (
                <>
                    <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4">
                        <StatCard
                            label="Total Orders"
                            value={filteredRows.length}
                            icon={ListOrdered}
                        />
                        <StatCard
                            label="Pending"
                            value={pendingCount}
                            icon={Coffee}
                        />
                        <StatCard
                            label="Completed"
                            value={completedCount}
                            icon={Coffee}
                        />
                        <StatCard
                            label="Cancelled"
                            value={cancelledCount}
                            icon={XCircle}
                        />
                    </div>

                    <div>
                        <FilterToolbar
                            tableState={tableState}
                            searchPlaceholder={searchPlaceholder}
                            filters={filterConfigs}
                            total={orders.length}
                            filtered={filteredRows.length}>
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

                    {(search.view ?? "table") === "table" ? (
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
                                                        {h.column.getCanSort() &&
                                                            (h.column.getIsSorted() ===
                                                            "asc" ? (
                                                                <ArrowUp className="size-3" />
                                                            ) : h.column.getIsSorted() ===
                                                              "desc" ? (
                                                                <ArrowDown className="size-3" />
                                                            ) : (
                                                                <ChevronsUpDown className="size-3 text-muted-foreground opacity-50" />
                                                            ))}
                                                    </div>
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableHeader>
                                <TableBody>
                                    {rows.map((row) => (
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
                                    Showing {filteredCount} order
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
                        </div>
                    ) : (
                        <OrdersBoard
                            orders={filteredRows}
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
}

export function OrdersPage() {
    return (
        <div className="space-y-6">
            <SectionHeader
                title="Orders"
                subtitle="View and manage orders across branches."
            />
            <OrdersContent />
        </div>
    );
}
