import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
    CreateMenuItemInput,
    UpdateMenuItemInput,
} from "@/features/menu/types";
import { menuKeys } from "@/features/query-keys";
import { api, type Envelope, toEnvelope } from "@/lib/eden";

/**
 * Menambahkan item menu baru ke database.
 */
export const createMenuItem = async (
    input: CreateMenuItemInput & { imageBase64?: string },
) => {
    const { data, error } = await api.menu.items.post({ ...input });
    return toEnvelope(data, error);
};

/**
 * Memperbarui data item menu yang sudah ada.
 */
export const updateMenuItem = async ({
    id,
    ...rest
}: UpdateMenuItemInput & {
    id: string;
    imageBase64?: string;
}) => {
    const { data, error } = await api.menu.items({ id }).put({ ...rest });
    return toEnvelope(data, error);
};

/**
 * Menghapus item menu berdasarkan id.
 */
export const deleteMenuItem = async (id: string): Promise<Envelope<null>> => {
    const { data, error } = await api.menu.items({ id }).delete();
    return toEnvelope(data, error);
};

/**
 * Mengubah status ketersediaan item menu (tampil/sembunyi).
 */
export const toggleMenuAvailability = async ({
    id,
    isAvailable,
}: {
    id: string;
    isAvailable: boolean;
}) => {
    const { data, error } = await api.menu
        .items({ id })
        .availability.patch({ isAvailable });
    return toEnvelope(data, error);
};

export const useCreateMenuItem = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateMenuItemInput & { imageBase64?: string }) =>
            createMenuItem(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: menuKeys.all }),
    });
};

export const useUpdateMenuItem = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (
            data: UpdateMenuItemInput & { id: string; imageBase64?: string },
        ) => updateMenuItem(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: menuKeys.all }),
    });
};

export const useDeleteMenuItem = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteMenuItem(id),
        onSettled: () => {
            qc.invalidateQueries({ queryKey: menuKeys.all });
        },
    });
};

export const useToggleAvailability = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            isAvailable,
        }: {
            id: string;
            isAvailable: boolean;
        }) => toggleMenuAvailability({ id, isAvailable }),
        onSettled: () => {
            qc.invalidateQueries({ queryKey: menuKeys.all });
        },
    });
};
