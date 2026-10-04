import { flexRender } from "@tanstack/react-table";
import {
    ArrowDown,
    ArrowUp,
    ChevronLeft,
    ChevronRight,
    ChevronsUpDown,
    MessageSquareQuote,
    Reply,
    Star,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { FilterToolbar } from "@/components/shared/filter-toolbar";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
    useModerateReview,
    useReplyReview,
} from "@/features/reviews/hooks/useReviewMutations";
import { useReviews } from "@/features/reviews/hooks/useReviewQueries";
import { useReviewsTable } from "@/features/reviews/hooks/useReviewsTable";
import type { ReviewRow } from "@/features/reviews/types";
import { pluralize } from "@/utils/format";

export function ReviewsTable() {
    const { data: reviewsData } = useReviews();
    const allReviews = reviewsData.data ?? [];
    const replyMutation = useReplyReview();
    const moderateMutation = useModerateReview();

    const [replyTarget, setReplyTarget] = useState<ReviewRow | null>(null);
    const [replyText, setReplyText] = useState("");

    const { table, tableState, filterConfigs, searchPlaceholder } =
        useReviewsTable(allReviews, {
            onReply: (row) => {
                setReplyTarget(row);
                setReplyText(row.reply ?? "");
            },
            onModerate: (row, status) => {
                moderateMutation.mutate(
                    { id: row.id, status },
                    {
                        onSuccess: (res) => {
                            if (res.success) {
                                toast.success(
                                    status === "approved"
                                        ? "Review approved"
                                        : "Review rejected",
                                );
                            } else {
                                toast.error("Failed to moderate review");
                            }
                        },
                        onError: () => {
                            toast.error("Failed to moderate review");
                        },
                    },
                );
            },
        });

    const rows = table.getRowModel().rows;
    const filteredCount = table.getFilteredRowModel().rows.length;
    const pageIndex = tableState.pagination.pageIndex;
    const pageCount = table.getPageCount();

    const averageRating =
        filteredCount > 0
            ? (
                  table
                      .getFilteredRowModel()
                      .rows.reduce((sum, r) => sum + r.original.rating, 0) /
                  filteredCount
              ).toFixed(1)
            : "0.0";

    const pendingCount = table
        .getFilteredRowModel()
        .rows.filter((r) => r.original.status === "pending").length;

    const approvedCount = table
        .getFilteredRowModel()
        .rows.filter((r) => r.original.status === "approved").length;

    async function handleReply() {
        if (!replyTarget || !replyText.trim()) return;
        const res = await replyMutation
            .mutateAsync({
                id: replyTarget.id,
                reply: replyText,
            })
            .catch(() => null);

        if (!res) return;

        if (res.success) {
            toast.success("Reply added");
        } else {
            toast.error("Failed to add reply");
        }
        setReplyTarget(null);
        setReplyText("");
    }

    return (
        <div className="flex flex-col gap-4">
            {allReviews.length === 0 ? (
                <Empty>
                    <EmptyMedia variant="icon">
                        <MessageSquareQuote />
                    </EmptyMedia>
                    <EmptyTitle>No reviews yet</EmptyTitle>
                    <EmptyDescription>
                        Customer reviews will appear here once submitted.
                    </EmptyDescription>
                </Empty>
            ) : (
                <>
                    <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4">
                        <StatCard
                            label="Average Rating"
                            value={averageRating}
                            icon={Star}
                        />
                        <StatCard label="Total Reviews" value={filteredCount} />
                        <StatCard label="Pending" value={pendingCount} />
                        <StatCard label="Approved" value={approvedCount} />
                    </div>

                    <FilterToolbar
                        tableState={tableState}
                        searchPlaceholder={searchPlaceholder}
                        filters={filterConfigs}
                        total={allReviews.length}
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

                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Showing {filteredCount}{" "}
                            {pluralize(filteredCount, "review")}
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

            <Dialog
                open={!!replyTarget}
                onOpenChange={(open) => {
                    if (!open) {
                        setReplyTarget(null);
                        setReplyText("");
                    }
                }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reply to Review</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {replyTarget?.comment && (
                            <div className="rounded-lg bg-muted p-3 text-sm">
                                <p className="font-medium">
                                    {replyTarget.customerName ?? "Anonymous"}
                                </p>
                                <p className="mt-1 text-muted-foreground">
                                    {replyTarget.comment}
                                </p>
                            </div>
                        )}
                        <Textarea
                            placeholder="Write your reply..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setReplyTarget(null);
                                setReplyText("");
                            }}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleReply}
                            disabled={!replyText.trim()}>
                            <Reply className="mr-1 size-3.5" /> Send Reply
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
