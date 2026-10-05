import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
	CreateMenuItemInput,
	MenuItem,
	MenuItemRow,
	UpdateMenuItemInput,
} from "@/features/menu/types";
import { menuKeys } from "@/features/query-keys";
import { api, type Envelope, toEnvelope } from "@/lib/eden";

/**
 * Menambahkan item menu baru ke database.
 */
export const createMenuItem = async (
	input: CreateMenuItemInput & { imageBase64?: string },
): Promise<Envelope<MenuItem>> => {
	const { data, error } = await api.menu.items.post({ ...input });
	return toEnvelope(data, error);
};

/**
 * Memperbarui data item menu yang sudah ada.
 *
 * Jika ada gambar baru (base64), gambar lama akan dihapus dari Cloudinary
 * lalu diganti dengan yang baru (ditangani server). Hanya field yang
 * dikirim yang akan diubah (partial update).
 */
export const updateMenuItem = async ({
	id,
	...rest
}: UpdateMenuItemInput & {
	id: string;
	imageBase64?: string;
}): Promise<Envelope<MenuItem>> => {
	const { data, error } = await api.menu.items({ id }).put({ ...rest });
	return toEnvelope(data, error);
};

/**
 * Menghapus item menu berdasarkan id.
 *
 * Server mengambil data item dulu untuk menghapus gambar dari Cloudinary
 * (jika ada). Hard delete — data tidak bisa dikembalikan.
 */
export const deleteMenuItem = async (id: string): Promise<Envelope<null>> => {
	const { data, error } = await api.menu.items({ id }).delete();
	return toEnvelope(data, error);
};

/**
 * Mengubah status ketersediaan item menu (tampil/sembunyi).
 *
 * Berguna untuk menyembunyikan item yang sedang habis atau tidak dijual
 * tanpa harus menghapusnya. Status di-toggle dari nilai saat ini.
 */
export const toggleMenuAvailability = async ({
	id,
	isAvailable,
}: {
	id: string;
	isAvailable: boolean;
}): Promise<Envelope<MenuItem>> => {
	const { data, error } = await api.menu
		.items({ id })
		.availability.patch({ isAvailable });
	return toEnvelope(data, error);
};

export function useCreateMenuItem() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (data: CreateMenuItemInput & { imageBase64?: string }) =>
			createMenuItem(data),
		onSuccess: () => qc.invalidateQueries({ queryKey: menuKeys.all }),
	});
}

export function useUpdateMenuItem() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (
			data: UpdateMenuItemInput & { id: string; imageBase64?: string },
		) => updateMenuItem(data),
		onSuccess: () => qc.invalidateQueries({ queryKey: menuKeys.all }),
	});
}

export function useDeleteMenuItem() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteMenuItem(id),
		onMutate: async (id) => {
			await qc.cancelQueries({ queryKey: menuKeys.items() });
			const previousItems = qc.getQueryData(menuKeys.items());
			if (previousItems) {
				qc.setQueryData(
					menuKeys.items(),
					(old: { data: MenuItemRow[] } | undefined) => {
						if (!old) return old;
						return {
							...old,
							data: old.data.filter((item) => item.id !== id),
						};
					},
				);
			}
			return { previousItems };
		},
		onError: (_err, _id, context) => {
			if (context?.previousItems) {
				qc.setQueryData(menuKeys.items(), context.previousItems);
			}
		},
		onSettled: () => {
			qc.invalidateQueries({ queryKey: menuKeys.all });
		},
	});
}

export function useToggleAvailability() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
			toggleMenuAvailability({ id, isAvailable }),
		onMutate: async ({ id, isAvailable }) => {
			await qc.cancelQueries({ queryKey: menuKeys.items() });
			const previousItems = qc.getQueryData(menuKeys.items());
			if (previousItems) {
				qc.setQueryData(
					menuKeys.items(),
					(old: { data: MenuItemRow[] } | undefined) => {
						if (!old) return old;
						return {
							...old,
							data: old.data.map((item) =>
								item.id === id ? { ...item, isAvailable } : item,
							),
						};
					},
				);
			}
			return { previousItems };
		},
		onError: (_err, _vars, context) => {
			if (context?.previousItems) {
				qc.setQueryData(menuKeys.items(), context.previousItems);
			}
		},
		onSettled: () => {
			qc.invalidateQueries({ queryKey: menuKeys.all });
		},
	});
}
