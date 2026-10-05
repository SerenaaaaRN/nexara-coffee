import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { myPortalKeys } from "@/features/query-keys";
import { api, toEnvelope } from "@/lib/eden";

export const createMyReviewSchema = z.object({
    orderId: z.string().min(1),
    rating: z.coerce.number().int().min(1).max(5),
    comment: z.string().max(500).optional().or(z.literal("")),
});

export type CreateMyReviewInput = z.infer<typeof createMyReviewSchema>;

/**
 * Membuat review milik customer yang sedang login untuk satu order completed.
 */
export const createMyReview = async (input: CreateMyReviewInput) => {
    const { data, error } = await api.my.reviews.post({
        orderId: input.orderId,
        rating: input.rating,
        comment: input.comment || undefined,
    });
    return toEnvelope(data, error);
};

export function useCreateMyReview() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateMyReviewInput) => createMyReview(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: myPortalKeys.all });
        },
    });
}
