import {
    keepPreviousData,
    queryOptions,
    useQuery,
    useSuspenseQuery,
} from "@tanstack/react-query";
import type { MenuCategory } from "@/features/menu/types";
import { menuKeys } from "@/features/query-keys";
import { STALE } from "@/features/stale-time";
import { api, type Envelope, toEnvelope } from "@/lib/eden";

export type MenuItemsFilters = {
    categoryId?: string | null;
    q?: string;
};

/**
 * Mengambil daftar kategori menu yang tersedia, diurutkan
 * berdasarkan `displayOrder`. Data ini digunakan untuk tab filter
 * kategori dan form dialog.
 */
export const getMenuCategories = async (): Promise<
    Envelope<MenuCategory[]>
> => {
    const { data, error } = await api.menu.categories.get();
    return toEnvelope(data, error);
};

/**
 * Mengambil daftar item menu beserta kategori masing-masing.
 * Search (`q`) dan filter kategori di-resolve di server.
 * Data digabung dengan tabel kategori (inner join) sehingga setiap item
 * memiliki properti `category`.
 */
export const getMenuItems = async (params?: MenuItemsFilters) => {
    const { data, error } = await api.menu.items.get({
        query: {
            categoryId: params?.categoryId ?? undefined,
            q: params?.q,
        },
    });
    return toEnvelope(data, error);
};

export const menuCategoriesOptions = () =>
    queryOptions({
        queryKey: menuKeys.categories(),
        queryFn: () => getMenuCategories(),
        staleTime: STALE.FREQUENT,
    });

export const menuItemsOptions = (params?: MenuItemsFilters) =>
    queryOptions({
        queryKey: menuKeys.items(params),
        queryFn: () => getMenuItems(params),
        staleTime: STALE.FREQUENT,
    });

export const useMenuCategories = () => {
    return useSuspenseQuery(menuCategoriesOptions());
};

export const useMenuItems = (params?: MenuItemsFilters) => {
    return useQuery({
        ...menuItemsOptions(params),
        placeholderData: keepPreviousData,
    });
};
