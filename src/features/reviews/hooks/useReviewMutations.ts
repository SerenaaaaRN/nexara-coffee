import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { reviewKeys } from "@/features/query-keys";
import type { Review } from "@/features/reviews/types";
import { replyReviewSchema } from "@/features/reviews/types";

/**
 * Membalas sebuah review (moderasi).
 *
 * Mengisi/mengosongkan kolom balasan review berdasarkan id.
 *
 * @param id - id review yang dibalas
 * @param reply - isi balasan (string kosong untuk menghapus balasan)
 * @returns {Review} Review yang sudah diperbarui
 */
export const replyReviewFn = createServerFn({ method: "POST" })
    .validator(replyReviewSchema.extend({ id: z.string() }))
    .handler(async ({ data: { id, ...data } }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("update", "reviews");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { supabaseAdmin } = await import("@database/server");

        const { data: row, error } = await supabaseAdmin
            .from("reviews")
            .update({ reply: data.reply || null })
            .eq("id", id)
            .select()
            .single();

        if (error || !row)
            return {
                success: false as const,
                error: error?.message ?? "Review tidak ditemukan",
            };

        const review: Review = {
            id: row.id,
            branchId: row.branch_id,
            customerId: row.customer_id,
            orderId: row.order_id,
            rating: row.rating,
            comment: row.comment,
            status: row.status,
            reply: row.reply,
            createdAt: row.created_at,
        };

        return { success: true as const, data: review };
    });

/** @see {@link replyReviewFn} */
export function useReplyReview() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (
            data: z.infer<typeof replyReviewSchema> & { id: string },
        ) => replyReviewFn({ data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: reviewKeys.all });
        },
    });
}

const moderateReviewSchema = z.object({
    status: z.enum(["approved", "rejected"]),
});

/**
 * Memoderasi sebuah review (approve/reject).
 *
 * Mengubah kolom status review berdasarkan id. Hanya status yang lolos
 * moderasi (`approved`) yang tampil di landing page publik.
 *
 * @param id - id review yang dimoderasi
 * @param status - status baru (`approved` atau `rejected`)
 * @returns {Review} Review yang sudah diperbarui
 */
export const moderateReviewFn = createServerFn({ method: "POST" })
    .validator(moderateReviewSchema.extend({ id: z.string() }))
    .handler(async ({ data: { id, ...data } }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("update", "reviews");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { supabaseAdmin } = await import("@database/server");

        const { data: row, error } = await supabaseAdmin
            .from("reviews")
            .update({ status: data.status })
            .eq("id", id)
            .select()
            .single();

        if (error || !row)
            return {
                success: false as const,
                error: error?.message ?? "Review tidak ditemukan",
            };

        const review: Review = {
            id: row.id,
            branchId: row.branch_id,
            customerId: row.customer_id,
            orderId: row.order_id,
            rating: row.rating,
            comment: row.comment,
            status: row.status,
            reply: row.reply,
            createdAt: row.created_at,
        };

        return { success: true as const, data: review };
    });

/** @see {@link moderateReviewFn} */
export function useModerateReview() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { id: string; status: "approved" | "rejected" }) =>
            moderateReviewFn({ data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: reviewKeys.all });
            queryClient.invalidateQueries({ queryKey: ["landing"] });
        },
    });
}
