import {
    createColumnHelper,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { Check, Reply, Star, X } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ReviewRow } from "@/features/reviews/types";
import type { TableState } from "@/hooks/useTableState";
import { capitalize, formatDate } from "@/utils/format";
import { getBadgeVariant } from "@/utils/status";

const columnHelper = createColumnHelper<ReviewRow>();

const StarRating = ({ rating }: { rating: number }) => {
    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }, (_, i) => (
                <Star
                    key={i}
                    className={`size-3.5 ${
                        i < rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-muted text-muted"
                    }`}
                />
            ))}
        </div>
    );
};

/**
 * Tabel reviews mode server-driven: search/sort/filter/page di-resolve di
 * server. `tableState` dibuat di komponen via `useTableState`.
 */
export const useReviewsTable = (
    reviews: ReviewRow[],
    options: {
        tableState: TableState;
        pageCount: number;
        callbacks: {
            onReply: (review: ReviewRow) => void;
            onModerate: (
                review: ReviewRow,
                status: "approved" | "rejected",
            ) => void;
        };
    },
) => {
    const { tableState, pageCount, callbacks } = options;

    /** Filter status + rating — nilainya dikirim sebagai param server. */
    const filterConfigs = useMemo(
        () => [
            {
                columnId: "status" as const,
                options: ["pending", "approved", "rejected"].map((s) => ({
                    value: s,
                    label: capitalize(s),
                })),
                placeholder: "All statuses",
            },
            {
                columnId: "rating" as const,
                options: [5, 4, 3, 2, 1].map((n) => ({
                    value: String(n),
                    label: `${n} Star${n > 1 ? "s" : ""}`,
                })),
                placeholder: "All ratings",
            },
        ],
        [],
    );

    /**
     * Kolom: createdAt, customerName, branchName, rating, comment, status,
     * actions. Sort server hanya untuk createdAt/rating/status (whitelist
     * `REVIEW_SORT_COLUMNS` di server).
     */
    const columns = useMemo(
        () => [
            columnHelper.accessor("createdAt", {
                header: "Date",
                cell: (info) =>
                    formatDate(info.row.original.createdAt, {
                        day: "numeric",
                        month: "short",
                    }),
            }),
            columnHelper.accessor("customerName", {
                header: "Customer",
                enableSorting: false,
                cell: (info) => (
                    <span className="font-medium">
                        {info.row.original.customerName ?? "Anonymous"}
                    </span>
                ),
            }),
            columnHelper.accessor("branchName", {
                header: "Branch",
                enableSorting: false,
                cell: (info) => info.row.original.branchName ?? "—",
            }),
            columnHelper.accessor("rating", {
                header: "Rating",
                cell: (info) => (
                    <StarRating rating={info.row.original.rating} />
                ),
            }),
            columnHelper.accessor("comment", {
                header: "Comment",
                enableSorting: false,
                cell: (info) => (
                    <div className="max-w-xs truncate">
                        {info.row.original.comment ?? "—"}
                    </div>
                ),
            }),
            columnHelper.accessor("status", {
                header: "Status",
                cell: (info) => (
                    <Badge variant={getBadgeVariant(info.row.original.status)}>
                        {capitalize(info.row.original.status)}
                    </Badge>
                ),
            }),
            columnHelper.display({
                id: "actions",
                header: "Actions",
                enableSorting: false,
                cell: ({ row }) => (
                    <div className="flex gap-1">
                        {row.original.status === "pending" ? (
                            <>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    title="Approve"
                                    onClick={() =>
                                        callbacks.onModerate(
                                            row.original,
                                            "approved",
                                        )
                                    }>
                                    <Check data-icon="inline-start" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    title="Reject"
                                    onClick={() =>
                                        callbacks.onModerate(
                                            row.original,
                                            "rejected",
                                        )
                                    }>
                                    <X data-icon="inline-start" />
                                </Button>
                            </>
                        ) : null}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => callbacks.onReply(row.original)}>
                            <Reply data-icon="inline-start" />
                        </Button>
                    </div>
                ),
            }),
        ],
        [callbacks.onReply, callbacks.onModerate],
    );

    /**
     * Instance useReactTable server-driven: tanpa row model client
     * (tanpa getFiltered/Sorted/PaginationRowModel).
     */
    const table = useReactTable({
        data: reviews,
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
        searchPlaceholder: "Search by customer, branch...",
    };
};
