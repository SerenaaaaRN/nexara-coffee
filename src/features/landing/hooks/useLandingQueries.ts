import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import type {
    PublicBranch,
    PublicMenuCategoryJoined,
    PublicMenuItem,
    PublicReview,
} from "@/features/landing/types";
import { landingKeys } from "@/features/query-keys";
import { STALE } from "@/features/stale-time";

/**
 * Mengambil daftar cabang aktif untuk landing page publik.
 *
 * Endpoint ini sengaja tanpa auth agar bisa diakses pengunjung yang belum
 * login. Kolom yang dikembalikan dibatasi hanya yang aman untuk publik
 * (tanpa manager_id dan data internal lain) dan hanya cabang berstatus aktif.
 *
 * @returns {PublicBranch[]} Daftar cabang aktif diurutkan berdasar nama
 */
export const getPublicBranchesFn = createServerFn({ method: "GET" }).handler(
    async () => {
        const { rateLimit } = await import("@/lib/rate-limit");
        if (!rateLimit("landing:public-branches", 60, 60_000))
            return { success: false as const, error: "Too many requests" };

        const { supabaseAdmin } = await import("@database/server");

        const { data, error } = await supabaseAdmin
            .from("branches")
            .select(
                "id, name, address, lat, lng, phone, opening_time, closing_time, ownership_type",
            )
            .eq("status", "active")
            .order("name", { ascending: true });

        if (error) return { success: false as const, error: error.message };

        const rows: PublicBranch[] = (data ?? []).map((r) => ({
            id: r.id,
            name: r.name,
            address: r.address,
            lat: r.lat,
            lng: r.lng,
            phone: r.phone,
            openingTime: r.opening_time,
            closingTime: r.closing_time,
            ownershipType: r.ownership_type,
        }));

        return { success: true as const, data: rows };
    },
);

/**
 * Mengambil menu unggulan yang tersedia untuk landing page publik.
 *
 * Endpoint ini sengaja tanpa auth. Hanya item dengan `is_available=true`
 * yang dikembalikan, digabung dengan kategorinya, maksimal 24 item
 * diurutkan berdasar urutan tampil kategori lalu nama.
 *
 * @returns {PublicMenuItem[]} Daftar menu tersedia beserta kategorinya
 */
export const getPublicMenuFn = createServerFn({ method: "GET" }).handler(
    async () => {
        const { rateLimit } = await import("@/lib/rate-limit");
        if (!rateLimit("landing:public-menu", 60, 60_000))
            return { success: false as const, error: "Too many requests" };

        const { supabaseAdmin } = await import("@database/server");

        const { data, error } = await supabaseAdmin
            .from("menu_items")
            .select(
                "id, category_id, name, description, price, image_url, category:menu_categories!menu_items_category_id_menu_categories_id_fk(id, name, display_order)",
            )
            .eq("is_available", true)
            .order("name", { ascending: true })
            .limit(24);

        if (error) return { success: false as const, error: error.message };

        const rows: PublicMenuItem[] = (
            (data ?? []) as unknown as PublicMenuCategoryJoined[]
        )
            .map((r) =>
                r.category === null
                    ? null
                    : {
                          id: r.id,
                          categoryId: r.category_id,
                          name: r.name,
                          description: r.description,
                          price: Number(r.price),
                          imageUrl: r.image_url,
                          category: {
                              id: r.category.id,
                              name: r.category.name,
                              displayOrder: r.category.display_order,
                          },
                      },
            )
            .filter((row): row is PublicMenuItem => row !== null)
            .sort(
                (a, b) =>
                    a.category.displayOrder - b.category.displayOrder ||
                    a.name.localeCompare(b.name),
            );

        return { success: true as const, data: rows };
    },
);

export const publicBranchesOptions = () =>
    queryOptions({
        queryKey: landingKeys.branches(),
        queryFn: () => getPublicBranchesFn(),
        staleTime: STALE.SLOW,
        gcTime: 10 * 60_000,
    });

export const publicMenuOptions = () =>
    queryOptions({
        queryKey: landingKeys.menu(),
        queryFn: () => getPublicMenuFn(),
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
export const getPublicReviewsFn = createServerFn({ method: "GET" }).handler(
    async () => {
        const { rateLimit } = await import("@/lib/rate-limit");
        if (!rateLimit("landing:public-reviews", 60, 60_000))
            return { success: false as const, error: "Too many requests" };

        const { supabaseAdmin } = await import("@database/server");

        const { data, error } = await supabaseAdmin
            .from("reviews")
            .select(
                "id, rating, comment, customers!reviews_customer_id_customers_id_fk(full_name), branches!reviews_branch_id_branches_id_fk(name)",
            )
            .eq("status", "approved")
            .order("created_at", { ascending: false })
            .limit(10);

        if (error) return { success: false as const, error: error.message };

        const rows: PublicReview[] = (
            (data ?? []) as unknown as {
                id: string;
                rating: number;
                comment: string | null;
                customers: { full_name: string } | null;
                branches: { name: string } | null;
            }[]
        )
            .filter((r) => r.comment !== null && r.comment.trim() !== "")
            .map((r) => ({
                id: r.id,
                rating: Number(r.rating),
                comment: (r.comment as string).trim(),
                customerName: r.customers?.full_name ?? null,
                branchName: r.branches?.name ?? null,
            }));

        return { success: true as const, data: rows };
    },
);

export const publicReviewsOptions = () =>
    queryOptions({
        queryKey: landingKeys.reviews(),
        queryFn: () => getPublicReviewsFn(),
        staleTime: STALE.SLOW,
        gcTime: 10 * 60_000,
    });

/** @see {@link getPublicBranchesFn} */
export function usePublicBranches() {
    return useSuspenseQuery(publicBranchesOptions());
}

/** @see {@link getPublicMenuFn} */
export function usePublicMenu() {
    return useSuspenseQuery(publicMenuOptions());
}

/** @see {@link getPublicReviewsFn} */
export function usePublicReviews() {
    return useSuspenseQuery(publicReviewsOptions());
}
