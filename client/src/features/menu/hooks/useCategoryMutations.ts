import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
    CreateCategoryInput,
    MenuCategory,
    UpdateCategoryInput,
} from "@/features/menu/types";
import { menuKeys } from "@/features/query-keys";
import { api, type Envelope, toEnvelope } from "@/lib/eden";

/**
 * Menambahkan kategori menu baru.
 *
 * `displayOrder` digunakan untuk mengatur urutan kategori saat ditampilkan
 * di halaman menu. Default 0 jika tidak disediakan.
 */
export const createCategory = async (
    input: CreateCategoryInput,
): Promise<Envelope<MenuCategory>> => {
    const { data, error } = await api.menu.categories.post({ ...input });
    return toEnvelope(data, error);
};

/**
 * Memperbarui nama dan/atau urutan tampil kategori menu.
 * Partial update — hanya field yang dikirim yang akan diubah.
 */
export const updateCategory = async ({
    id,
    ...rest
}: UpdateCategoryInput & { id: string }): Promise<Envelope<MenuCategory>> => {
    const { data, error } = await api.menu.categories({ id }).put({ ...rest });
    return toEnvelope(data, error);
};

/**
 * Menghapus kategori menu berdasarkan id.
 *
 * Server menolak penghapusan jika masih ada item menu yang menggunakan
 * kategori ini (400 + pesan jumlah item).
 */
export const deleteCategory = async (
    id: string,
): Promise<Envelope<unknown>> => {
    const { data, error } = await api.menu.categories({ id }).delete();
    return toEnvelope(data, error);
};

/**
 * Mengubah urutan tampil (`displayOrder`) kategori menu.
 * Berguna untuk drag-and-drop reordering kategori.
 * Urutan ditampilkan secara ASC berdasarkan nilai `displayOrder`.
 */
export const updateCategoryOrder = async ({
    id,
    displayOrder,
}: {
    id: string;
    displayOrder: number;
}): Promise<Envelope<unknown>> => {
    const { data, error } = await api.menu
        .categories({ id })
        .order.patch({ displayOrder });
    return toEnvelope(data, error);
};

export function useCreateCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateCategoryInput) => createCategory(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: menuKeys.categories() });
            qc.invalidateQueries({ queryKey: menuKeys.all });
        },
    });
}

export function useUpdateCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: UpdateCategoryInput & { id: string }) =>
            updateCategory(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: menuKeys.categories() });
        },
    });
}

export function useDeleteCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteCategory(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: menuKeys.categories() });
            qc.invalidateQueries({ queryKey: menuKeys.all });
        },
    });
}

export function useUpdateCategoryOrder() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            displayOrder,
        }: {
            id: string;
            displayOrder: number;
        }) => updateCategoryOrder({ id, displayOrder }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: menuKeys.categories() });
        },
    });
}
