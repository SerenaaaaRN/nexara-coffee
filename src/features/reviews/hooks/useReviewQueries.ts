import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { reviewKeys } from "@/features/query-keys";
import type { ReviewJoined, ReviewRow } from "@/features/reviews/types";
import { STALE } from "@/features/stale-time";

/**
 * Mengambil daftar review beserta nama branch & customer.
 *
 * Filter opsional berdasarkan branch dan status. Diurutkan
 * berdasarkan waktu dibuat (terbaru dulu).
 *
 * @param branchId - filter branch (opsional)
 * @param status - filter status review (opsional)
 * @returns {ReviewRow[]} Daftar review dengan nama branch & customer
 */
export const getReviewsFn = createServerFn({ method: "GET" })
    .validator(
        z
            .object({
                branchId: z.string().optional(),
                status: z.string().optional(),
            })
            .optional(),
    )
    .handler(async ({ data: params }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("read", "reviews");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { supabaseAdmin } = await import("@database/server");

        let reviewsQuery = supabaseAdmin
            .from("reviews")
            .select(
                "id, branch_id, customer_id, order_id, rating, comment, status, reply, created_at, branches!reviews_branch_id_branches_id_fk(id, name), customers!reviews_customer_id_customers_id_fk(id, full_name)",
            )
            .order("created_at", { ascending: false });

        if (params?.branchId)
            reviewsQuery = reviewsQuery.eq("branch_id", params.branchId);
        if (params?.status)
            reviewsQuery = reviewsQuery.eq("status", params.status);

        const { data, error } = await reviewsQuery;
        if (error) return { success: false as const, error: error.message };

        const rows: ReviewRow[] = (
            (data ?? []) as unknown as ReviewJoined[]
        ).map((r) => ({
            id: r.id,
            branchId: r.branch_id,
            customerId: r.customer_id,
            orderId: r.order_id,
            rating: r.rating,
            comment: r.comment,
            status: r.status,
            reply: r.reply,
            createdAt: r.created_at,
            branchName: r.branches?.name ?? null,
            customerName: r.customers?.full_name ?? null,
        }));

        return { success: true as const, data: rows satisfies ReviewRow[] };
    });

export const reviewsOptions = (params?: {
    branchId?: string;
    status?: string;
}) =>
    queryOptions({
        queryKey: reviewKeys.list(params),
        queryFn: () => getReviewsFn({ data: params }),
        staleTime: STALE.FREQUENT,
    });

/** @see {@link getReviewsFn} */
export function useReviews(params?: { branchId?: string; status?: string }) {
    return useSuspenseQuery(reviewsOptions(params));
}
