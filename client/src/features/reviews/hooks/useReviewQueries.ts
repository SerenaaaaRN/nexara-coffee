import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { reviewKeys } from "@/features/query-keys";
import { STALE } from "@/features/stale-time";
import { api, toEnvelope } from "@/lib/eden";

/**
 * Mengambil daftar review beserta nama branch & customer.
 */
export const getReviews = async (params?: {
    branchId?: string;
    status?: string;
}) => {
    const { data, error } =
        params == null
            ? await api.reviews.get()
            : await api.reviews.get({ query: { ...params } });
    return toEnvelope(data, error);
};

export const reviewsOptions = (params?: {
    branchId?: string;
    status?: string;
}) =>
    queryOptions({
        queryKey: reviewKeys.list(params),
        queryFn: () => getReviews(params),
        staleTime: STALE.FREQUENT,
    });

export function useReviews(params?: { branchId?: string; status?: string }) {
    return useSuspenseQuery(reviewsOptions(params));
}
