import { Ban, Check } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { KASIR_STATUS_ICONS, KASIR_STATUSES } from "@/features/kasir/data";
import {
    useApproveSetoran,
    useRejectSetoran,
} from "@/features/kasir/hooks/useKasirMutations";
import { useExpectedCash } from "@/features/kasir/hooks/useKasirQueries";
import type { SetoranRow } from "@/features/kasir/types";
import {
    capitalize,
    formatCurrency,
    formatDate,
    formatTime,
} from "@/utils/format";
import { getBadgeVariant } from "@/utils/status";

interface Props {
    setoran: SetoranRow | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    canApprove: boolean;
}

export const KasirDetailDialog = ({
    setoran,
    open,
    onOpenChange,
    canApprove,
}: Props) => {
    const approveMutation = useApproveSetoran();
    const rejectMutation = useRejectSetoran();

    const { data: expectedRes, isLoading: expectedLoading } = useExpectedCash(
        setoran?.branchId ?? "",
        setoran?.date ?? "",
        { enabled: !!setoran?.branchId && !!setoran?.date && open },
    );
    const expectedData = expectedRes?.success ? expectedRes.data : undefined;

    if (!setoran) return null;
    const s = setoran;
    const diff = Number(s.amount) - (expectedData?.cashTotal ?? 0);
    const diffLabel =
        diff === 0 ? "Difference" : diff > 0 ? "Surplus" : "Shortage";
    const diffColor =
        diff === 0
            ? "text-green-600"
            : diff > 0
              ? "text-yellow-600"
              : "text-red-600";
    const currentStep =
        KASIR_STATUSES.indexOf(s.status as (typeof KASIR_STATUSES)[number]) + 1;

    async function handleApprove() {
        const res = await approveMutation
            .mutateAsync({ id: s.id, formData: {} })
            .catch(() => null);
        if (res?.success) {
            toast.success("Setoran approved");
            onOpenChange(false);
        } else {
            toast.error("Failed to approve setoran");
        }
    }

    async function handleReject() {
        const res = await rejectMutation
            .mutateAsync({ id: s.id, formData: {} })
            .catch(() => null);
        if (res?.success) {
            toast.success("Setoran rejected");
            onOpenChange(false);
        } else {
            toast.error("Failed to reject setoran");
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Setoran Detail</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <span className="text-muted-foreground">
                                Amount
                            </span>
                            <p className="font-medium">
                                {formatCurrency(s.amount)}
                            </p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">
                                Branch
                            </span>
                            <p className="font-medium">{s.branchName ?? "—"}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">
                                Cashier
                            </span>
                            <p className="font-medium">
                                {s.cashierName ?? "—"}
                            </p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Date</span>
                            <p className="font-medium">{formatDate(s.date)}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">
                                Status
                            </span>
                            <Badge
                                variant={getBadgeVariant(s.status)}
                                className="mt-0.5">
                                {capitalize(s.status)}
                            </Badge>
                        </div>
                    </div>

                    {expectedLoading ? (
                        <div className="rounded-lg border bg-muted/50 p-3 text-sm">
                            <Skeleton className="h-4 w-40" />
                            <div className="mt-2 space-y-1.5">
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-3 w-3/4" />
                            </div>
                        </div>
                    ) : expectedData ? (
                        <div className="rounded-lg border bg-muted/50 p-3 text-sm">
                            <p className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wider">
                                POS Comparison
                            </p>
                            <div className="space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Declared (Setoran)
                                    </span>
                                    <span className="font-mono tabular-nums">
                                        {formatCurrency(s.amount)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Expected Cash (POS)
                                    </span>
                                    <span className="font-mono tabular-nums">
                                        {expectedData.cashTotal === 0
                                            ? "Rp 0 (no cash transactions)"
                                            : formatCurrency(
                                                  expectedData.cashTotal,
                                              )}
                                    </span>
                                </div>
                                <Separator className="my-1.5" />
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        {diffLabel}
                                    </span>
                                    <span
                                        className={`font-mono tabular-nums ${diffColor}`}>
                                        {formatCurrency(Math.abs(diff))}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    <div>
                        <h4 className="mb-2 text-sm font-medium">
                            Approval Timeline
                        </h4>
                        <Timeline defaultValue={currentStep}>
                            {KASIR_STATUSES.map((statusKey, i) => {
                                const step = i + 1;
                                const Icon = KASIR_STATUS_ICONS[statusKey];
                                return (
                                    <TimelineItem key={statusKey} step={step}>
                                        <TimelineHeader>
                                            <TimelineSeparator />
                                            <TimelineTitle className="capitalize">
                                                {statusKey}
                                            </TimelineTitle>
                                            <TimelineIndicator className="bg-primary/10 group-data-completed/timeline-item:bg-primary group-data-completed/timeline-item:text-primary-foreground flex size-6 items-center justify-center border-none">
                                                <Icon className="size-3" />
                                            </TimelineIndicator>
                                        </TimelineHeader>
                                        <TimelineContent>
                                            {step <= currentStep
                                                ? statusKey === "pending"
                                                    ? "Created"
                                                    : "Completed"
                                                : "Waiting"}
                                            {step === currentStep && (
                                                <TimelineDate className="mt-1">
                                                    {formatTime(s.createdAt)}
                                                </TimelineDate>
                                            )}
                                        </TimelineContent>
                                    </TimelineItem>
                                );
                            })}
                        </Timeline>
                    </div>

                    {canApprove && s.status === "pending" && (
                        <div className="flex gap-2">
                            <Button
                                variant="default"
                                className="flex-1"
                                disabled={
                                    approveMutation.isPending ||
                                    rejectMutation.isPending
                                }
                                onClick={handleApprove}>
                                <Check data-icon="inline-start" />
                                Approve
                            </Button>
                            <Button
                                variant="destructive"
                                className="flex-1"
                                disabled={
                                    approveMutation.isPending ||
                                    rejectMutation.isPending
                                }
                                onClick={handleReject}>
                                <Ban data-icon="inline-start" />
                                Reject
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
