import type { Database } from "@database/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import type {
    CreateMenuItemInput,
    MenuItem,
    MenuItemRow,
    UpdateMenuItemInput,
} from "@/features/menu/types";
import { menuKeys } from "@/features/query-keys";

/**
 * Menambahkan item menu baru ke database.
 *
 * Mendukung upload gambar opsional melalui base64 — gambar akan diunggah
 * ke Cloudinary sebelum item disimpan. Data dikirim via `createServerFn`
 * dengan validasi Zod.
 *
 * @returns Item baru yang berhasil dibuat
 */
export const createMenuItemFn = createServerFn({ method: "POST" })
    .validator((data: CreateMenuItemInput & { imageBase64?: string }) => data)
    .handler(async ({ data }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("create", "menu");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { supabaseAdmin } = await import("@database/server");

        let imageUrl = data.imageUrl;
        if (data.imageBase64) {
            const { uploadImageBase64 } = await import("@/lib/cloudinary");
            const result = await uploadImageBase64(data.imageBase64);
            imageUrl = result.url;
        }

        const { data: item, error } = await supabaseAdmin
            .from("menu_items")
            .insert({
                id: crypto.randomUUID(),
                category_id: data.categoryId,
                name: data.name,
                description: data.description ?? null,
                price: String(data.price),
                variants: data.variants ? JSON.stringify(data.variants) : null,
                image_url: imageUrl ?? null,
            })
            .select()
            .single();

        if (error || !item)
            return {
                success: false as const,
                error: error?.message ?? "Gagal membuat item menu",
            };

        return {
            success: true as const,
            data: {
                id: item.id,
                categoryId: item.category_id,
                name: item.name,
                description: item.description,
                price: item.price,
                variants: item.variants as
                    | { name: string; price: number }[]
                    | null,
                imageUrl: item.image_url,
                isAvailable: item.is_available,
            } satisfies MenuItem,
        };
    });

/**
 * Memperbarui data item menu yang sudah ada.
 *
 * Jika ada gambar baru (base64), gambar lama akan dihapus dari Cloudinary
 * lalu diganti dengan yang baru. Hanya field yang dikirim yang akan diubah
 * (partial update).
 *
 * @returns Item yang sudah diperbarui
 */
export const updateMenuItemFn = createServerFn({ method: "POST" })
    .validator(
        (data: UpdateMenuItemInput & { id: string; imageBase64?: string }) =>
            data,
    )
    .handler(async ({ data }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("update", "menu");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { supabaseAdmin } = await import("@database/server");

        let imageUrl = data.imageUrl;
        if (data.imageBase64) {
            const { uploadImageBase64 } = await import("@/lib/cloudinary");
            const result = await uploadImageBase64(data.imageBase64);
            imageUrl = result.url;
        }

        if (data.imageUrl && data.imageUrl !== imageUrl) {
            const { deleteImage, getPublicId } = await import(
                "@/lib/cloudinary"
            );
            const publicId = getPublicId(data.imageUrl);
            if (publicId) await deleteImage(publicId);
        }

        const updates: Database["public"]["Tables"]["menu_items"]["Update"] =
            {};
        if (data.name !== undefined) updates.name = data.name;
        if (data.description !== undefined)
            updates.description = data.description;
        if (data.price !== undefined) updates.price = String(data.price);
        if (data.categoryId !== undefined)
            updates.category_id = data.categoryId;
        if (data.variants !== undefined)
            updates.variants = data.variants
                ? JSON.stringify(data.variants)
                : null;
        if (imageUrl !== undefined) updates.image_url = imageUrl;

        const { data: item, error } = await supabaseAdmin
            .from("menu_items")
            .update(updates)
            .eq("id", data.id)
            .select()
            .single();
        if (error || !item)
            return {
                success: false as const,
                error: error?.message ?? "Gagal memperbarui item menu",
            };
        return {
            success: true as const,
            data: {
                id: item.id,
                categoryId: item.category_id,
                name: item.name,
                description: item.description,
                price: item.price,
                variants: item.variants as
                    | { name: string; price: number }[]
                    | null,
                imageUrl: item.image_url,
                isAvailable: item.is_available,
            } satisfies MenuItem,
        };
    });

/**
 * Menghapus item menu berdasarkan id.
 *
 * Sebelum dihapus, sistem mengambil data item untuk menghapus gambar
 * dari Cloudinary (jika ada). Hard delete — data tidak bisa dikembalikan.
 */
export const deleteMenuItemFn = createServerFn({ method: "POST" })
    .validator((data: { id: string }) => data)
    .handler(async ({ data: { id } }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("delete", "menu");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { supabaseAdmin } = await import("@database/server");

        const { data: item } = await supabaseAdmin
            .from("menu_items")
            .select("id, image_url")
            .eq("id", id)
            .maybeSingle();
        if (item?.image_url) {
            const { deleteImage, getPublicId } = await import(
                "@/lib/cloudinary"
            );
            const publicId = getPublicId(item.image_url);
            if (publicId) await deleteImage(publicId);
        }

        const { error } = await supabaseAdmin
            .from("menu_items")
            .delete()
            .eq("id", id);
        if (error) return { success: false as const, error: error.message };
        return { success: true as const };
    });

/**
 * Mengubah status ketersediaan item menu (tampil/sembunyi).
 *
 * Berguna untuk menyembunyikan item yang sedang habis atau tidak dijual
 * tanpa harus menghapusnya. Status di-toggle dari nilai saat ini.
 */
export const toggleMenuAvailabilityFn = createServerFn({ method: "POST" })
    .validator((data: { id: string; isAvailable: boolean }) => data)
    .handler(async ({ data: { id, isAvailable } }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("update", "menu");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { supabaseAdmin } = await import("@database/server");

        const { data: item, error } = await supabaseAdmin
            .from("menu_items")
            .update({ is_available: isAvailable })
            .eq("id", id)
            .select()
            .single();
        if (error || !item)
            return {
                success: false as const,
                error: error?.message ?? "Gagal mengubah ketersediaan item",
            };
        return {
            success: true as const,
            data: {
                id: item.id,
                categoryId: item.category_id,
                name: item.name,
                description: item.description,
                price: item.price,
                variants: item.variants as
                    | { name: string; price: number }[]
                    | null,
                imageUrl: item.image_url,
                isAvailable: item.is_available,
            } satisfies MenuItem,
        };
    });

/** @see {@link createMenuItemFn} */
export function useCreateMenuItem() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateMenuItemInput & { imageBase64?: string }) =>
            createMenuItemFn({ data }),
        onSuccess: () => qc.invalidateQueries({ queryKey: menuKeys.all }),
    });
}

/** @see {@link updateMenuItemFn} */
export function useUpdateMenuItem() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (
            data: UpdateMenuItemInput & { id: string; imageBase64?: string },
        ) => updateMenuItemFn({ data }),
        onSuccess: () => qc.invalidateQueries({ queryKey: menuKeys.all }),
    });
}

/** @see {@link deleteMenuItemFn} */
export function useDeleteMenuItem() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteMenuItemFn({ data: { id } }),
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

/** @see {@link toggleMenuAvailabilityFn} */
export function useToggleAvailability() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            isAvailable,
        }: {
            id: string;
            isAvailable: boolean;
        }) => toggleMenuAvailabilityFn({ data: { id, isAvailable } }),
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
                                item.id === id
                                    ? { ...item, isAvailable }
                                    : item,
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
