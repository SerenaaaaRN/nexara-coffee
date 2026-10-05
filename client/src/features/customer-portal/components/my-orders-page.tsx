import { zodResolver } from "@hookform/resolvers/zod";
import { Coffee, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { SectionHeader } from "@/components/shared/section-header";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Empty,
    EmptyDescription,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";
import {
    Field,
    FieldContent,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
    createMyReviewSchema,
    useCreateMyReview,
} from "@/features/customer-portal/hooks/useCustomerPortalMutations";
import { useMyOrders } from "@/features/customer-portal/hooks/useCustomerPortalQueries";
import type { MyOrder } from "@/features/customer-portal/types";
import { cn } from "@/utils/cn";
import { formatCurrency, formatDateTime } from "@/utils/format";
import { getBadgeVariant, getStatusLabel } from "@/utils/status";

function ReviewDialog({
    order,
    open,
    onOpenChange,
}: {
    order: MyOrder | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const createReview = useCreateMyReview();
    const {
        control,
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(createMyReviewSchema.omit({ orderId: true })),
        defaultValues: { rating: 5, comment: "" },
    });

    async function onSubmit(values: { rating: number; comment?: string }) {
        if (!order) return;
        const res = await createReview
            .mutateAsync({
                orderId: order.id,
                rating: values.rating,
                comment: values.comment ?? "",
            })
            .catch(() => null);
        if (res?.success) {
            toast.success("Ulasan terkirim, menunggu moderasi");
            reset();
            onOpenChange(false);
        } else {
            toast.error(
                typeof res?.error === "string"
                    ? res.error
                    : "Gagal mengirim ulasan",
            );
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Beri Ulasan</DialogTitle>
                    <DialogDescription>
                        {order
                            ? `Order ${order.orderNumber} · ${order.branchName ?? "-"}`
                            : null}
                    </DialogDescription>
                </DialogHeader>
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="flex flex-col gap-4">
                    <FieldGroup>
                        <Field data-invalid={!!errors.rating}>
                            <FieldLabel>Rating</FieldLabel>
                            <FieldContent>
                                <Controller
                                    control={control}
                                    name="rating"
                                    render={({ field }) => (
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map((n) => (
                                                <button
                                                    key={n}
                                                    type="button"
                                                    onClick={() =>
                                                        field.onChange(n)
                                                    }
                                                    className="cursor-pointer p-1"
                                                    aria-label={`${n} bintang`}>
                                                    <Star
                                                        className={cn(
                                                            "size-6",
                                                            n <= field.value
                                                                ? "fill-yellow-400 text-yellow-400"
                                                                : "text-muted-foreground",
                                                        )}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                />
                                <FieldError errors={[errors.rating]} />
                            </FieldContent>
                        </Field>
                        <Field data-invalid={!!errors.comment}>
                            <FieldLabel htmlFor="comment">
                                Komentar (opsional)
                            </FieldLabel>
                            <FieldContent>
                                <Textarea
                                    id="comment"
                                    placeholder="Ceritakan pengalaman kamu..."
                                    aria-invalid={!!errors.comment}
                                    {...register("comment")}
                                />
                                <FieldError errors={[errors.comment]} />
                            </FieldContent>
                        </Field>
                    </FieldGroup>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={createReview.isPending}>
                            {createReview.isPending
                                ? "Mengirim..."
                                : "Kirim Ulasan"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function MyOrdersPage() {
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
        useMyOrders();
    const [reviewTarget, setReviewTarget] = useState<MyOrder | null>(null);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    const firstPage = data.pages[0];
    if (!firstPage?.success)
        throw new Error(firstPage?.error ?? "Gagal memuat pesanan");
    const total = firstPage.data.total;
    const completedTotal = firstPage.data.completedTotal;
    const orders = data.pages.flatMap((p) => (p.success ? p.data.rows : []));

    useEffect(() => {
        const el = loadMoreRef.current;
        if (!el || !hasNextPage || isFetchingNextPage) return;
        const io = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) fetchNextPage();
            },
            { rootMargin: "400px" },
        );
        io.observe(el);
        return () => io.disconnect();
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    if (total === 0) {
        return (
            <div className="space-y-6">
                <SectionHeader
                    title="Pesananku"
                    subtitle="Riwayat pesanan kamu di Nexara Coffee."
                />
                <Empty>
                    <EmptyMedia variant="icon">
                        <Coffee />
                    </EmptyMedia>
                    <EmptyTitle>Belum ada pesanan</EmptyTitle>
                    <EmptyDescription>
                        Pesanan kamu akan muncul di sini setelah memesan di
                        cabang Nexara Coffee.
                    </EmptyDescription>
                </Empty>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Pesananku"
                subtitle="Riwayat pesanan kamu di Nexara Coffee."
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <StatCard label="Total Pesanan" value={total} icon={Coffee} />
                <StatCard
                    label="Selesai"
                    value={completedTotal}
                    icon={Coffee}
                />
            </div>
            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>No. Order</TableHead>
                            <TableHead>Cabang</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">
                                Tanggal
                            </TableHead>
                            <TableHead className="text-right">Ulasan</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.map((o) => (
                            <TableRow key={o.id}>
                                <TableCell className="font-medium tabular-nums">
                                    {o.orderNumber}
                                </TableCell>
                                <TableCell>{o.branchName ?? "-"}</TableCell>
                                <TableCell>
                                    <Badge variant={getBadgeVariant(o.status)}>
                                        {getStatusLabel(o.status)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                    {formatCurrency(o.totalAmount)}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                    {formatDateTime(o.createdAt)}
                                </TableCell>
                                <TableCell className="text-right">
                                    {o.status === "completed" &&
                                    !o.hasReview ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setReviewTarget(o)}>
                                            <Star className="size-3" />
                                            Beri Ulasan
                                        </Button>
                                    ) : o.hasReview ? (
                                        <span className="text-xs text-muted-foreground">
                                            Sudah diulas
                                        </span>
                                    ) : null}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            {hasNextPage ? (
                <div ref={loadMoreRef} className="flex justify-center py-4">
                    <span className="text-sm text-muted-foreground">
                        {isFetchingNextPage
                            ? "Memuat pesanan..."
                            : "Scroll untuk memuat pesanan berikutnya"}
                    </span>
                </div>
            ) : null}
            <ReviewDialog
                order={reviewTarget}
                open={!!reviewTarget}
                onOpenChange={(open) => {
                    if (!open) setReviewTarget(null);
                }}
            />
        </div>
    );
}
