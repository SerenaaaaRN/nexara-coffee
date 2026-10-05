import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import type {
    PublicBranch,
    PublicMenuItem,
    PublicReview,
} from "@/features/landing/types";
import { landingKeys } from "@/features/query-keys";
import { STALE } from "@/features/stale-time";
import { api, type Envelope, toEnvelope } from "@/lib/eden";

/**
 * Mengambil daftar cabang aktif untuk landing page publik.
 */
export const getPublicBranches = async (): Promise<
    Envelope<PublicBranch[]>
> => {
    const { data, error } = await api.landing.branches.get();
    return toEnvelope(data, error);
};

/**
 * Mengambil menu unggulan yang tersedia untuk landing page publik.
 */
export const getPublicMenu = async (): Promise<Envelope<PublicMenuItem[]>> => {
    const { data, error } = await api.landing.menu.get();
    return toEnvelope(data, error);
};

export const publicBranchesOptions = () =>
    queryOptions({
        queryKey: landingKeys.branches(),
        queryFn: () => getPublicBranches(),
        staleTime: STALE.SLOW,
        gcTime: 10 * 60_000,
    });

export const publicMenuOptions = () =>
    queryOptions({
        queryKey: landingKeys.menu(),
        queryFn: () => getPublicMenu(),
        staleTime: STALE.SLOW,
        gcTime: 10 * 60_000,
    });

/**
 * Mengambil ulasan pelanggan yang sudah lolos moderasi untuk landing publik.
 */
export const getPublicReviews = async (): Promise<Envelope<PublicReview[]>> => {
    const { data, error } = await api.landing.reviews.get();
    return toEnvelope(data, error);
};

export const publicReviewsOptions = () =>
    queryOptions({
        queryKey: landingKeys.reviews(),
        queryFn: () => getPublicReviews(),
        staleTime: STALE.SLOW,
        gcTime: 10 * 60_000,
    });

export function usePublicBranches() {
    return useSuspenseQuery(publicBranchesOptions());
}

export function usePublicMenu() {
    return useSuspenseQuery(publicMenuOptions());
}

export function usePublicReviews() {
    return useSuspenseQuery(publicReviewsOptions());
}
