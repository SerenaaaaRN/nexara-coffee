import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { reviewKeys } from "@/features/query-keys";
import type { replyReviewSchema } from "@/features/reviews/types";
import { api, toEnvelope } from "@/lib/eden";

/**
 * Membalas sebuah review (moderasi).
 * Mengisi/mengosongkan kolom balasan review berdasarkan id.
 */
export const replyReview = async (
    input: z.infer<typeof replyReviewSchema> & { id: string },
) => {
    const { data, error } = await api
        .reviews({ id: input.id })
        .reply.post({ reply: input.reply ?? "" });
    return toEnvelope(data, error);
};

export const useReplyReview = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (
            data: z.infer<typeof replyReviewSchema> & { id: string },
        ) => replyReview(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: reviewKeys.all });
        },
    });
};

const moderateReviewSchema = z.object({
    status: z.enum(["approved", "rejected"]),
});

/**
 * Memoderasi sebuah review (approve/reject).
 * Mengubah kolom status review berdasarkan id. Hanya status yang lolos
 * moderasi (`approved`) yang tampil di landing page publik.
 */
export const moderateReview = async (input: {
    id: string;
    status: "approved" | "rejected";
}) => {
    const { data, error } = await api
        .reviews({ id: input.id })
        .moderate.post({ status: input.status });
    return toEnvelope(data, error);
};

export const useModerateReview = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (
            data: z.infer<typeof moderateReviewSchema> & { id: string },
        ) => moderateReview(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: reviewKeys.all });
            queryClient.invalidateQueries({ queryKey: ["landing"] });
        },
    });
};
