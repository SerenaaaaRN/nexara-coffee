import { Ban } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
    Kanban,
    KanbanBoard,
    KanbanColumn,
    KanbanColumnContent,
    KanbanItem,
    KanbanItemHandle,
    type KanbanMoveEvent,
    KanbanOverlay,
} from "@/components/shared/kanban";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ORDER_STATUSES } from "@/features/orders/data";
import {
    useCancelOrder,
    useUpdateOrderStatus,
} from "@/features/orders/hooks/useOrderMutations";
import type { OrderRow } from "@/features/orders/types";
import { formatCurrency, formatTime } from "@/utils/format";
import { groupByStatus } from "@/utils/group-by";
import { getBadgeVariant, getStatusLabel } from "@/utils/status";

function cloneColumns(
    prev: Record<string, OrderRow[]>,
): Record<string, OrderRow[]> {
    const next: Record<string, OrderRow[]> = {};
    for (const s of ORDER_STATUSES) next[s] = [...(prev[s] || [])];
    return next;
}

function removeFromColumns(
    columns: Record<string, OrderRow[]>,
    id: string,
): OrderRow | undefined {
    for (const s of ORDER_STATUSES) {
        if (!columns[s]) continue;
        const idx = columns[s].findIndex((o) => o.id === id);
        if (idx !== -1) {
            const [removed] = columns[s].splice(idx, 1);
            return removed;
        }
    }
}

interface Props {
    orders: OrderRow[];
    canUpdate: boolean;
    onSelectOrder: (order: OrderRow) => void;
}

export function OrdersBoard({
    orders: allOrders,
    canUpdate,
    onSelectOrder,
}: Props) {
    const [columns, setColumns] = useState<Record<string, OrderRow[]>>(() =>
        groupByStatus(allOrders, ORDER_STATUSES),
    );

    const updateStatusMutation = useUpdateOrderStatus();
    const cancelOrderMutation = useCancelOrder();

    // Sync state when allOrders changes (e.g. from TanStack Query refetch or realtime)
    useEffect(() => {
        setColumns(groupByStatus(allOrders, ORDER_STATUSES));
    }, [allOrders]);

    async function handleMove(e: KanbanMoveEvent) {
        if (e.activeContainer === e.overContainer) return;
        const orderId = e.event.active.id as string;
        const newStatus = e.overContainer as (typeof ORDER_STATUSES)[number];

        // Snapshot sebelum optimistic update untuk rollback jika gagal
        const prev = columns;
        const next = cloneColumns(prev);
        const moved = removeFromColumns(next, orderId);
        if (moved) next[newStatus].splice(e.overIndex, 0, moved);
        setColumns(next);

        const res = await updateStatusMutation
            .mutateAsync({ orderId, status: newStatus })
            .catch(() => null);

        if (!res?.success) {
            toast.error("Failed to update order status");
            setColumns(prev);
            return;
        }
        toast.success(`Order → ${getStatusLabel(newStatus)}`);
    }

    async function handleCancel(orderId: string) {
        // Snapshot sebelum optimistic update untuk rollback jika gagal
        const prev = columns;
        const next = cloneColumns(prev);
        removeFromColumns(next, orderId);
        setColumns(next);

        const res = await cancelOrderMutation
            .mutateAsync({ orderId })
            .catch(() => null);

        if (res?.success) {
            toast.success("Order cancelled");
        } else {
            toast.error(
                typeof res?.error === "string"
                    ? res.error
                    : "Failed to cancel order",
            );
            setColumns(prev);
        }
    }

    return (
        <Kanban
            value={columns}
            onValueChange={setColumns}
            getItemValue={(o) => o.id}
            onMove={handleMove}>
            <KanbanBoard className="h-[calc(100vh-16rem)] grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                {ORDER_STATUSES.map((colId) => {
                    const items = columns[colId] ?? [];
                    return (
                        <KanbanColumn key={colId} value={colId}>
                            <div className="flex h-full flex-col rounded-lg border bg-card">
                                <div className="flex items-center gap-2 border-b px-4 py-3">
                                    <Badge
                                        variant={getBadgeVariant(colId)}
                                        className="size-2 p-0 rounded-full"
                                        aria-hidden
                                    />
                                    <span className="text-sm font-medium capitalize">
                                        {getStatusLabel(colId)}
                                    </span>
                                    <Badge
                                        variant="outline"
                                        className="ml-auto">
                                        {items.length}
                                    </Badge>
                                </div>
                                <KanbanColumnContent
                                    value={colId}
                                    className="flex-1 gap-2 overflow-y-auto p-3">
                                    {items.map((order) => (
                                        <KanbanItem
                                            key={order.id}
                                            value={order.id}
                                            disabled={!canUpdate}>
                                            <KanbanItemHandle>
                                                {/** biome-ignore lint/a11y/useSemanticElements: <nested button> */}
                                                <div
                                                    role="button"
                                                    tabIndex={0}
                                                    className="w-full cursor-pointer rounded-md border bg-muted/50 p-3 text-left transition-colors hover:bg-muted"
                                                    onClick={() =>
                                                        onSelectOrder(order)
                                                    }
                                                    onKeyDown={(e) => {
                                                        if (
                                                            e.key === "Enter" ||
                                                            e.key === " "
                                                        ) {
                                                            e.preventDefault();
                                                            onSelectOrder(
                                                                order,
                                                            );
                                                        }
                                                    }}>
                                                    <div className="mb-1.5 flex items-start justify-between gap-2">
                                                        <span className="font-mono text-xs font-medium">
                                                            {order.orderNumber}
                                                        </span>
                                                        <Badge
                                                            variant={getBadgeVariant(
                                                                order.status,
                                                            )}>
                                                            {getStatusLabel(
                                                                order.status,
                                                            )}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm font-medium">
                                                        {order.customerName ??
                                                            "Guest"}
                                                    </p>
                                                    <p className="mt-0.5 font-mono text-sm">
                                                        {formatCurrency(
                                                            order.totalAmount,
                                                        )}
                                                    </p>
                                                    <div className="mt-1.5 flex items-center justify-between">
                                                        <span className="text-xs text-muted-foreground">
                                                            {order.branchName}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatTime(
                                                                order.createdAt,
                                                            )}
                                                        </span>
                                                    </div>
                                                    {canUpdate &&
                                                        order.status !==
                                                            "completed" &&
                                                        order.status !==
                                                            "cancelled" && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="mt-2 h-7 w-full text-xs text-destructive"
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    handleCancel(
                                                                        order.id,
                                                                    );
                                                                }}>
                                                                <Ban data-icon="inline-start" />
                                                                Cancel
                                                            </Button>
                                                        )}
                                                </div>
                                            </KanbanItemHandle>
                                        </KanbanItem>
                                    ))}
                                    {items.length === 0 ? (
                                        <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
                                            No orders
                                        </div>
                                    ) : null}
                                </KanbanColumnContent>
                            </div>
                        </KanbanColumn>
                    );
                })}
            </KanbanBoard>
            <KanbanOverlay className="rounded-md border-2 border-dashed bg-muted/10" />
        </Kanban>
    );
}
