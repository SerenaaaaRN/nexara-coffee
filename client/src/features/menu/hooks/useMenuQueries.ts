import {
    keepPreviousData,
    queryOptions,
    useQuery,
    useSuspenseQuery,
} from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import type {
    MenuCategory,
    MenuItemJoined,
    MenuItemRow,
    MenuItemVariant,
} from "@/features/menu/types";
import { menuKeys } from "@/features/query-keys";
import { STALE } from "@/features/stale-time";

/**
 * Mengambil daftar semua kategori menu yang tersedia, diurutkan
 * berdasarkan `displayOrder`. Data ini digunakan untuk tab filter
 * kategori dan form dialog.
 *
 * @returns {MenuCategory[]} Kategori menu dengan id, nama, dan urutan tampil
 */
export const getMenuCategoriesFn = createServerFn({ method: "GET" }).handler(
    async () => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("read", "menu");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { supabaseAdmin } = await import("@database/server");

        const { data, error } = await supabaseAdmin
            .from("menu_categories")
            .select("id, name, display_order")
            .order("display_order", { ascending: true });

        if (error) return { success: false as const, error: error.message };

        const rows: MenuCategory[] = (data ?? []).map((r) => ({
            id: r.id,
            name: r.name,
            displayOrder: r.display_order,
        }));
        return { success: true as const, data: rows };
    },
);

/**
 * Mengambil daftar item menu beserta kategori masing-masing.
 *
 * Jika `categoryId` diberikan, hanya item dalam kategori tersebut yang
 * dikembalikan. Jika tidak, semua item dikembalikan.
 * Data digabung dengan tabel kategori (inner join) sehingga setiap item
 * memiliki properti `category`.
 *
 * @param categoryId - Filter berdasarkan id kategori (opsional)
 * @returns {MenuItemRow[]} Item menu dengan detail kategori
 */
export const getMenuItemsFn = createServerFn({ method: "GET" })
    .validator((data: { categoryId?: string | null }) => data)
    .handler(async ({ data: { categoryId } }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("read", "menu");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { supabaseAdmin } = await import("@database/server");

        let query = supabaseAdmin
            .from("menu_items")
            .select(
                "id, category_id, name, description, price, variants, image_url, is_available, category:menu_categories!menu_items_category_id_menu_categories_id_fk(id, name, display_order)",
            )
            .order("name", { ascending: true });

        if (categoryId) query = query.eq("category_id", categoryId);

        const { data, error } = await query;

        if (error) return { success: false as const, error: error.message };

        const rows: MenuItemRow[] = (
            (data ?? []) as unknown as MenuItemJoined[]
        )
            .map((r) =>
                r.category === null
                    ? null
                    : {
                          id: r.id,
                          categoryId: r.category_id,
                          name: r.name,
                          description: r.description,
                          price: r.price,
                          variants: r.variants as MenuItemVariant[] | null,
                          imageUrl: r.image_url,
                          isAvailable: r.is_available,
                          category: {
                              id: r.category.id,
                              name: r.category.name,
                              displayOrder: r.category.display_order,
                          },
                      },
            )
            .filter((row): row is MenuItemRow => row !== null)
            .sort(
                (a, b) =>
                    a.category.displayOrder - b.category.displayOrder ||
                    a.name.localeCompare(b.name),
            );

        return { success: true as const, data: rows };
    });

export const menuCategoriesOptions = () =>
    queryOptions({
        queryKey: menuKeys.categories(),
        queryFn: () => getMenuCategoriesFn(),
        staleTime: STALE.FREQUENT,
    });

export const menuItemsOptions = (categoryId?: string | null) =>
    queryOptions({
        queryKey: menuKeys.items(categoryId),
        queryFn: () => getMenuItemsFn({ data: { categoryId } }),
        staleTime: STALE.FREQUENT,
    });

/** @see {@link getMenuCategoriesFn} */
export function useMenuCategories() {
    return useSuspenseQuery(menuCategoriesOptions());
}

/** @see {@link getMenuItemsFn} */
export function useMenuItems(categoryId?: string | null) {
    return useQuery({
        ...menuItemsOptions(categoryId),
        placeholderData: keepPreviousData,
    });
}
