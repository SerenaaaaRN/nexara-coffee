import { Ban } from "lucide-react";
import { toast } from "sonner";
import {
    Timeline,
    TimelineContent,
    TimelineDate,
    TimelineHeader,
    TimelineIndicator,
    TimelineItem,
    TimelineSeparator,
    TimelineTitle,
} from "@/components/shared/timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ORDER_STATUS_ICONS, ORDER_STATUSES } from "@/features/orders/data";
import { useCancelOrder } from "@/features/orders/hooks/useOrderMutations";
import type { OrderRow } from "@/features/orders/types";
import { formatCurrency, formatDate, formatTime } from "@/utils/format";
import { getBadgeVariant, getStatusLabel } from "@/utils/status";

interface Props {
    order: OrderRow | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    canUpdate: boolean;
}

export function OrdersDetailDialog({
    order,
    open,
    onOpenChange,
    canUpdate,
}: Props) {
    const cancelOrderMutation = useCancelOrder();

    if (!order) return null;

    const currentStep =
        ORDER_STATUSES.indexOf(
            order.status as (typeof ORDER_STATUSES)[number],
        ) + 1;

    async function handleCancel() {
        if (!order) return;
        const res = await cancelOrderMutation
            .mutateAsync({ orderId: order.id })
            .catch(() => null);

        if (res?.success) {
            toast.success("Order cancelled");
            onOpenChange(false);
        } else {
            toast.error(
                typeof res?.error === "string"
                    ? res.error
                    : "Failed to cancel order",
            );
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Order {order.orderNumber}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <span className="text-muted-foreground">
                                Customer
                            </span>
                            <p className="font-medium">
                                {order.customerName ?? "Guest"}
                            </p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">
                                Branch
                            </span>
                            <p className="font-medium">
                                {order.branchName ?? "—"}
                            </p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Total</span>
                            <p className="font-medium">
                                {formatCurrency(order.totalAmount)}
                            </p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">
                                Status
                            </span>
                            <div className="mt-0.5">
                                <Badge variant={getBadgeVariant(order.status)}>
                                    {getStatusLabel(order.status)}
                                </Badge>
                            </div>
                        </div>
                        <div className="col-span-2">
                            <span className="text-muted-foreground">Date</span>
                            <p className="font-medium">
                                {formatDate(order.createdAt, {
                                    dateStyle: "long",
                                })}
                            </p>
                        </div>
                    </div>

                    <div>
                        <h4 className="mb-2 text-sm font-medium">
                            Order Timeline
                        </h4>
                        <Timeline defaultValue={currentStep}>
                            {ORDER_STATUSES.map((s, i) => {
                                const step = i + 1;
                                const Icon = ORDER_STATUS_ICONS[s];
                                return (
                                    <TimelineItem key={s} step={step}>
                                        <TimelineHeader>
                                            <TimelineSeparator />
                                            <TimelineTitle>
                                                {getStatusLabel(s)}
                                            </TimelineTitle>
                                            <TimelineIndicator className="flex size-6 border-none items-center justify-center bg-primary/10 group-data-completed:bg-primary group-data-completed:text-primary-foreground">
                                                <Icon className="size-3" />
                                            </TimelineIndicator>
                                        </TimelineHeader>
                                        <TimelineContent>
                                            {step <= currentStep
                                                ? "Completed"
                                                : "Waiting"}
                                            {step === currentStep && (
                                                <TimelineDate className="mt-1">
                                                    {formatTime(
                                                        order.createdAt,
                                                    )}
                                                </TimelineDate>
                                            )}
                                        </TimelineContent>
                                    </TimelineItem>
                                );
                            })}
                        </Timeline>
                    </div>

                    {canUpdate &&
                        order.status !== "completed" &&
                        order.status !== "cancelled" && (
                            <Button
                                variant="destructive"
                                className="w-full"
                                onClick={handleCancel}>
                                <Ban data-icon="inline-start" />
                                Cancel Order
                            </Button>
                        )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
