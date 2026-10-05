import {
	keepPreviousData,
	queryOptions,
	useQuery,
	useSuspenseQuery,
} from "@tanstack/react-query";
import type { MenuCategory, MenuItemRow } from "@/features/menu/types";
import { menuKeys } from "@/features/query-keys";
import { STALE } from "@/features/stale-time";
import { api, type Envelope, toEnvelope } from "@/lib/eden";

/**
 * Mengambil daftar semua kategori menu yang tersedia, diurutkan
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
 *
 * Jika `categoryId` diberikan, hanya item dalam kategori tersebut yang
 * dikembalikan. Jika tidak, semua item dikembalikan.
 * Data digabung dengan tabel kategori (inner join) sehingga setiap item
 * memiliki properti `category`.
 */
export const getMenuItems = async (
	categoryId?: string | null,
): Promise<Envelope<MenuItemRow[]>> => {
	const { data, error } =
		categoryId == null
			? await api.menu.items.get()
			: await api.menu.items.get({ query: { categoryId } });
	return toEnvelope(data, error);
};

export const menuCategoriesOptions = () =>
	queryOptions({
		queryKey: menuKeys.categories(),
		queryFn: () => getMenuCategories(),
		staleTime: STALE.FREQUENT,
	});

export const menuItemsOptions = (categoryId?: string | null) =>
	queryOptions({
		queryKey: menuKeys.items(categoryId),
		queryFn: () => getMenuItems(categoryId),
		staleTime: STALE.FREQUENT,
	});

export function useMenuCategories() {
	return useSuspenseQuery(menuCategoriesOptions());
}

export function useMenuItems(categoryId?: string | null) {
	return useQuery({
		...menuItemsOptions(categoryId),
		placeholderData: keepPreviousData,
	});
}
