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
 *
 * Endpoint ini sengaja tanpa auth agar bisa diakses pengunjung yang belum
 * login. Kolom yang dikembalikan dibatasi hanya yang aman untuk publik
 * (tanpa manager_id dan data internal lain) dan hanya cabang berstatus aktif.
 *
 * @returns {PublicBranch[]} Daftar cabang aktif diurutkan berdasar nama
 */
export const getPublicBranches = async (): Promise<
    Envelope<PublicBranch[]>
> => {
    const { data, error } = await api.landing.branches.get();
    return toEnvelope(data, error);
};

/**
 * Mengambil menu unggulan yang tersedia untuk landing page publik.
 *
 * Endpoint ini sengaja tanpa auth. Hanya item dengan `is_available=true`
 * yang dikembalikan, digabung dengan kategorinya, maksimal 24 item
 * diurutkan berdasar urutan tampil kategori lalu nama.
 *
 * @returns {PublicMenuItem[]} Daftar menu tersedia beserta kategorinya
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
 *
 * Endpoint ini sengaja tanpa auth. Hanya review berstatus `approved` dengan
 * komentar yang dikembalikan, maksimal 10 terbaru beserta nama pelanggan
 * dan cabang. Kalau belum ada, mengembalikan array kosong.
 *
 * @returns {PublicReview[]} Daftar ulasan approved terbaru
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

/** @see {@link getPublicBranches} */
export function usePublicBranches() {
    return useSuspenseQuery(publicBranchesOptions());
}

/** @see {@link getPublicMenu} */
export function usePublicMenu() {
    return useSuspenseQuery(publicMenuOptions());
}

/** @see {@link getPublicReviews} */
export function usePublicReviews() {
    return useSuspenseQuery(publicReviewsOptions());
}
