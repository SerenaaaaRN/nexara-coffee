import { queryOptions, useQuery } from "@tanstack/react-query";
import { reviewKeys } from "@/features/query-keys";
import { STALE } from "@/features/stale-time";
import { api, toEnvelope } from "@/lib/eden";

export type ReviewFilters = {
    branchId?: string;
    status?: string;
    rating?: number;
};

export type ReviewsTableParams = {
    q?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortDir?: "asc" | "desc";
};

/**
 * Mengambil daftar review beserta nama branch & customer.
 * Search/sort/page di-resolve di server.
 */
export const getReviews = async (
    params?: ReviewFilters & ReviewsTableParams,
) => {
    const { data, error } = await api.reviews.get({
        query: {
            branchId: params?.branchId,
            status: params?.status,
            rating: params?.rating,
            q: params?.q,
            page: params?.page,
            pageSize: params?.pageSize,
            sortBy: params?.sortBy,
            sortDir: params?.sortDir,
        },
    });
    return toEnvelope(data, error);
};

export const reviewsOptions = (params?: ReviewFilters & ReviewsTableParams) =>
    queryOptions({
        queryKey: reviewKeys.list(params),
        queryFn: () => getReviews(params),
        staleTime: STALE.FREQUENT,
    });

/**
 * Query tabel reviews (non-suspense): `placeholderData` menahan halaman
 * lama saat `q/page/sort` berubah agar tidak kedip.
 */
export const reviewsTableOptions = (
    params?: ReviewFilters & ReviewsTableParams,
) =>
    queryOptions({
        queryKey: reviewKeys.list(params),
        queryFn: () => getReviews(params),
        staleTime: STALE.FREQUENT,
        placeholderData: (previousData) => previousData,
    });

export const useReviewsTableQuery = (
    params?: ReviewFilters & ReviewsTableParams,
) => {
    return useQuery(reviewsTableOptions(params));
};
