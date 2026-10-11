import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
    CreateMyReviewInput,
    UpdateMyPhoneInput,
} from "@/features/customer-portal/types";
import { myPortalKeys } from "@/features/query-keys";
import { api, toEnvelope } from "@/lib/eden";

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

/**
 * Mengubah nomor HP profil customer milik user yang sedang login.
 */
export const updateMyPhone = async (input: UpdateMyPhoneInput) => {
    const { data, error } = await api.my.phone.patch({
        phone: input.phone,
    });
    return toEnvelope(data, error);
};

export const useUpdateMyPhone = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: UpdateMyPhoneInput) => updateMyPhone(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: myPortalKeys.all });
        },
    });
};
