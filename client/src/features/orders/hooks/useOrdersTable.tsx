import {
    createColumnHelper,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { Ban } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ORDER_STATUSES } from "@/features/orders/data";
import type { OrderRow, OrderStatus } from "@/features/orders/types";
import { useTableState } from "@/hooks/useTableState";
import { formatCurrency, formatDateTime } from "@/utils/format";
import { getBadgeVariant, getStatusLabel } from "@/utils/status";

const columnHelper = createColumnHelper<OrderRow>();

/**
 * Mempersiapkan column definitions, filter configs, useTableState, dan instance useReactTable
 * untuk tabel orders. canUpdate / onStatusChange / onCancel diteruskan ke kolom aksi
 * (status select dropdown + cancel button).
 */
export function useOrdersTable(
    orders: OrderRow[],
    callbacks: {
        canUpdate: boolean;
        onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
        onCancel: (orderId: string) => void;
    },
) {
    const tableState = useTableState();

    /** Filter berdasarkan status order (pending/processing/completed/cancelled). */
    const filterConfigs = useMemo(
        () => [
            {
                columnId: "status" as const,
                options: ORDER_STATUSES.map((s) => ({
                    value: s,
                    label: getStatusLabel(s),
                })),
                placeholder: "All statuses",
            },
        ],
        [],
    );

    /**
     * Kolom: orderNumber, branchId, customerId, totalAmount, status, createdAt,
     * actions (status select dropdown + cancel button).
     */
    const columns = useMemo(
        () => [
            columnHelper.accessor("orderNumber", {
                id: "orderNumber",
                header: "Order #",
                cell: ({ getValue }) => (
                    <span className="font-mono text-xs font-medium">
                        {getValue()}
                    </span>
                ),
            }),
            columnHelper.accessor("branchId", {
                id: "branchId",
                header: "Branch",
                cell: ({ row }) => row.original.branchName ?? "—",
            }),
            columnHelper.accessor("customerId", {
                id: "customerId",
                header: "Customer",
                cell: ({ row }) => row.original.customerName ?? "—",
            }),
            columnHelper.accessor("totalAmount", {
                id: "totalAmount",
                header: "Total",
                cell: ({ getValue }) => (
                    <span className="font-mono">
                        {formatCurrency(getValue())}
                    </span>
                ),
            }),
            columnHelper.accessor("status", {
                id: "status",
                header: "Status",
                cell: ({ getValue }) => (
                    <Badge variant={getBadgeVariant(getValue())}>
                        {getStatusLabel(getValue())}
                    </Badge>
                ),
                filterFn: (row, _columnId, filterValue) => {
                    if (!filterValue) return true;
                    return row.original.status === filterValue;
                },
            }),
            columnHelper.accessor("createdAt", {
                id: "createdAt",
                header: "Date",
                cell: ({ getValue }) => (
                    <span className="text-sm text-muted-foreground">
                        {formatDateTime(getValue())}
                    </span>
                ),
            }),
            columnHelper.display({
                id: "actions",
                header: "Actions",
                cell: ({ row }) => {
                    const order = row.original;
                    if (!callbacks.canUpdate) return null;

                    return (
                        // biome-ignore lint/a11y/noStaticElementInteractions: <trust me>
                        <div
                            className="flex items-center gap-1"
                            role="presentation"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}>
                            <Select
                                value={order.status}
                                onValueChange={(v) =>
                                    callbacks.onStatusChange(
                                        order.id,
                                        (v ?? order.status) as OrderStatus,
                                    )
                                }
                                items={Object.fromEntries(
                                    ORDER_STATUSES.map((s) => [
                                        s,
                                        getStatusLabel(s),
                                    ]),
                                )}>
                                <SelectTrigger className="h-8 w-32 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {ORDER_STATUSES.map((s) => {
                                            const isDisabled =
                                                order.status === "completed" &&
                                                s !== "completed";
                                            const isSame = s === order.status;
                                            const isCancel = s === "cancelled";
                                            return (
                                                <SelectItem
                                                    key={s}
                                                    value={s}
                                                    disabled={
                                                        isDisabled ||
                                                        isSame ||
                                                        isCancel
                                                    }>
                                                    {getStatusLabel(s)}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            {order.status !== "completed" &&
                                order.status !== "cancelled" && (
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        onClick={() =>
                                            callbacks.onCancel(order.id)
                                        }>
                                        <Ban />
                                    </Button>
                                )}
                        </div>
                    );
                },
            }),
        ],
        [callbacks.canUpdate, callbacks.onStatusChange, callbacks.onCancel],
    );

    /**
     * Instance useReactTable.
     * globalFilterFn mencari berdasarkan orderNumber, customerName, branchName.
     */
    const table = useReactTable({
        data: orders,
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
            const q = String(filterValue).toLowerCase();
            const s = row.original;
            return (
                s.orderNumber.toLowerCase().includes(q) ||
                (s.customerName ?? "").toLowerCase().includes(q) ||
                (s.branchName ?? "").toLowerCase().includes(q)
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
        searchPlaceholder: "Search by order, customer, branch...",
    };
}
