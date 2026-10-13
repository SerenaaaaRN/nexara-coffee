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
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ReviewsSkeleton } from "@/components/fallbacks/dashboard";
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
import type {
    ReviewFilters,
    ReviewsTableParams,
} from "@/features/reviews/hooks/useReviewQueries";
import { useReviewsTableQuery } from "@/features/reviews/hooks/useReviewQueries";
import { useReviewsTable } from "@/features/reviews/hooks/useReviewsTable";
import type { ReviewRow } from "@/features/reviews/types";
import { useTableState } from "@/hooks/useTableState";
import { pluralize } from "@/utils/format";

export const ReviewsTable = () => {
    const tableState = useTableState();
    const replyMutation = useReplyReview();
    const moderateMutation = useModerateReview();

    const [replyTarget, setReplyTarget] = useState<ReviewRow | null>(null);
    const [replyText, setReplyText] = useState("");

    const status = tableState.getFilterValue("status");
    const ratingValue = tableState.getFilterValue("rating");

    const queryParams = useMemo(() => {
        const params: ReviewFilters & ReviewsTableParams = {
            status,
            pageSize: tableState.pagination.pageSize,
        };
        const rating = Number(ratingValue);
        if (ratingValue !== undefined && Number.isFinite(rating)) {
            params.rating = rating;
        }
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
        status,
        ratingValue,
        tableState.debouncedSearch,
        tableState.pagination.pageIndex,
        tableState.pagination.pageSize,
        tableState.sortBy,
        tableState.sortDir,
    ]);

    const { data: response, isPending } = useReviewsTableQuery(queryParams);

    const payload = response?.success ? response.data : null;
    const rows = payload?.rows ?? [];
    const total = payload?.total ?? 0;
    const summary = payload?.summary ?? {
        total: 0,
        averageRating: "0.0",
        pending: 0,
        approved: 0,
    };
    const loadError = response && !response.success ? response.error : null;

    const hasActiveFilter =
        tableState.debouncedSearch.trim() !== "" ||
        status !== undefined ||
        ratingValue !== undefined;

    const pageCount = Math.max(
        1,
        Math.ceil(total / tableState.pagination.pageSize),
    );

    const { table, filterConfigs, searchPlaceholder } = useReviewsTable(rows, {
        tableState,
        pageCount,
        callbacks: {
            onReply: (row) => {
                setReplyTarget(row);
                setReplyText(row.reply ?? "");
            },
            onModerate: (row, moderateStatus) => {
                moderateMutation.mutate(
                    { id: row.id, status: moderateStatus },
                    {
                        onSuccess: (res) => {
                            if (res.success) {
                                toast.success(
                                    moderateStatus === "approved"
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
        },
    });

    const tableRows = table.getRowModel().rows;
    const pageIndex = tableState.pagination.pageIndex;

    const handleReply = async () => {
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
    };

    if (isPending && !payload && !loadError) {
        return <ReviewsSkeleton />;
    }

    return (
        <div className="flex flex-col gap-4">
            {loadError ? (
                <Empty>
                    <EmptyMedia variant="icon">
                        <MessageSquareQuote />
                    </EmptyMedia>
                    <EmptyTitle>Failed to load reviews</EmptyTitle>
                    <EmptyDescription>{loadError}</EmptyDescription>
                </Empty>
            ) : (
                <>
                    <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4">
                        <StatCard
                            label="Average Rating"
                            value={summary.averageRating}
                            icon={Star}
                        />
                        <StatCard label="Total Reviews" value={summary.total} />
                        <StatCard label="Pending" value={summary.pending} />
                        <StatCard label="Approved" value={summary.approved} />
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
                                <MessageSquareQuote />
                            </EmptyMedia>
                            <EmptyTitle>
                                {hasActiveFilter
                                    ? "No matching reviews"
                                    : "No reviews yet"}
                            </EmptyTitle>
                            <EmptyDescription>
                                {hasActiveFilter
                                    ? "Try adjusting your search or filters."
                                    : "Customer reviews will appear here once submitted."}
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
                                    Showing {rows.length} of {total}{" "}
                                    {pluralize(total, "review")}
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
                        {replyTarget?.comment ? (
                            <div className="rounded-lg bg-muted p-3 text-sm">
                                <p className="font-medium">
                                    {replyTarget.customerName ?? "Anonymous"}
                                </p>
                                <p className="mt-1 text-muted-foreground">
                                    {replyTarget.comment}
                                </p>
                            </div>
                        ) : null}
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
};
