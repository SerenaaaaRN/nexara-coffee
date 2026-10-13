import {
    createColumnHelper,
    getCoreRowModel,
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
import type { TableState } from "@/hooks/useTableState";
import { formatCurrency, formatDateTime } from "@/utils/format";
import { getBadgeVariant, getStatusLabel } from "@/utils/status";

const columnHelper = createColumnHelper<OrderRow>();

/**
 * Tabel orders mode server-driven: search/sort/filter/page di-resolve di
 * server. `tableState` dibuat di page via `useTableState` agar nilai
 * debounce-nya bisa dipakai sebagai query params sebelum tabel dibangun.
 */
export const useOrdersTable = (
    orders: OrderRow[],
    options: {
        tableState: TableState;
        pageCount: number;
        callbacks: {
            canUpdate: boolean;
            onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
            onCancel: (orderId: string) => void;
        };
    },
) => {
    const { tableState, pageCount, callbacks } = options;

    /** Filter berdasarkan status order — nilainya dikirim sebagai param server. */
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
     * Sort server hanya untuk orderNumber/totalAmount/status/createdAt
     * (whitelist `ORDER_SORT_COLUMNS` di server).
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
                enableSorting: false,
                cell: ({ row }) => row.original.branchName ?? "—",
            }),
            columnHelper.accessor("customerId", {
                id: "customerId",
                header: "Customer",
                enableSorting: false,
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
                enableSorting: false,
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
                            order.status !== "cancelled" ? (
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={() =>
                                        callbacks.onCancel(order.id)
                                    }>
                                    <Ban />
                                </Button>
                            ) : null}
                        </div>
                    );
                },
            }),
        ],
        [callbacks.canUpdate, callbacks.onStatusChange, callbacks.onCancel],
    );

    /**
     * Instance useReactTable server-driven: tanpa row model client
     * (tanpa getFiltered/Sorted/PaginationRowModel).
     */
    const table = useReactTable({
        data: orders,
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
        searchPlaceholder: "Search by order, customer, branch...",
    };
};
