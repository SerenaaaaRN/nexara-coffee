import type { Database } from "@database/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import type {
    CreateCategoryInput,
    MenuCategory,
    UpdateCategoryInput,
} from "@/features/menu/types";
import { menuKeys } from "@/features/query-keys";

/**
 * Menambahkan kategori menu baru.
 *
 * `displayOrder` digunakan untuk mengatur urutan kategori saat ditampilkan
 * di halaman menu. Default 0 jika tidak disediakan.
 *
 * @returns Kategori yang baru dibuat
 */
export const createCategoryFn = createServerFn({ method: "POST" })
    .validator((data: CreateCategoryInput) => data)
    .handler(async ({ data }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("create", "menu");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { supabaseAdmin } = await import("@database/server");

        const { data: cat, error } = await supabaseAdmin
            .from("menu_categories")
            .insert({
                id: crypto.randomUUID(),
                name: data.name,
                display_order: data.displayOrder ?? 0,
            })
            .select()
            .single();
        if (error || !cat)
            return {
                success: false as const,
                error: error?.message ?? "Gagal membuat kategori",
            };
        return {
            success: true as const,
            data: {
                id: cat.id,
                name: cat.name,
                displayOrder: cat.display_order,
            } satisfies MenuCategory,
        };
    });

/**
 * Memperbarui nama dan/atau urutan tampil kategori menu.
 * Partial update — hanya field yang dikirim yang akan diubah.
 *
 * @returns Kategori yang sudah diperbarui
 */
export const updateCategoryFn = createServerFn({ method: "POST" })
    .validator((data: UpdateCategoryInput & { id: string }) => data)
    .handler(async ({ data }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("update", "menu");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { supabaseAdmin } = await import("@database/server");

        const updates: Database["public"]["Tables"]["menu_categories"]["Update"] =
            {};
        if (data.name !== undefined) updates.name = data.name;
        if (data.displayOrder !== undefined)
            updates.display_order = data.displayOrder;

        const { data: cat, error } = await supabaseAdmin
            .from("menu_categories")
            .update(updates)
            .eq("id", data.id)
            .select()
            .single();
        if (error || !cat)
            return {
                success: false as const,
                error: error?.message ?? "Gagal memperbarui kategori",
            };
        return {
            success: true as const,
            data: {
                id: cat.id,
                name: cat.name,
                displayOrder: cat.display_order,
            } satisfies MenuCategory,
        };
    });

/**
 * Menghapus kategori menu berdasarkan id.
 *
 * Sebelum dihapus, sistem mengecek apakah masih ada item menu yang
 * menggunakan kategori ini. Jika masih ada, penghapusan ditolak.
 */
export const deleteCategoryFn = createServerFn({ method: "POST" })
    .validator((data: { id: string }) => data)
    .handler(async ({ data: { id } }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("delete", "menu");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { supabaseAdmin } = await import("@database/server");

        const { count, error: countError } = await supabaseAdmin
            .from("menu_items")
            .select("id", { count: "exact", head: true })
            .eq("category_id", id);
        if (countError)
            return { success: false as const, error: countError.message };
        if ((count ?? 0) > 0) {
            return {
                success: false as const,
                error: `Cannot delete — ${count} menu item(s) still use this category`,
            };
        }

        const { error } = await supabaseAdmin
            .from("menu_categories")
            .delete()
            .eq("id", id);
        if (error) return { success: false as const, error: error.message };
        return { success: true as const };
    });

/**
 * Mengubah urutan tampil (`displayOrder`) kategori menu.
 * Berguna untuk drag-and-drop reordering kategori.
 * Urutan ditampilkan secara ASC berdasarkan nilai `displayOrder`.
 */
export const updateCategoryOrderFn = createServerFn({ method: "POST" })
    .validator((data: { id: string; displayOrder: number }) => data)
    .handler(async ({ data: { id, displayOrder } }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("update", "menu");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { supabaseAdmin } = await import("@database/server");

        const { error } = await supabaseAdmin
            .from("menu_categories")
            .update({ display_order: displayOrder })
            .eq("id", id);
        if (error) return { success: false as const, error: error.message };
        return { success: true as const };
    });

/** @see {@link createCategoryFn} */
export function useCreateCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateCategoryInput) => createCategoryFn({ data }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: menuKeys.categories() });
            qc.invalidateQueries({ queryKey: menuKeys.all });
        },
    });
}

/** @see {@link updateCategoryFn} */
export function useUpdateCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: UpdateCategoryInput & { id: string }) =>
            updateCategoryFn({ data }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: menuKeys.categories() });
        },
    });
}

/** @see {@link deleteCategoryFn} */
export function useDeleteCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteCategoryFn({ data: { id } }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: menuKeys.categories() });
            qc.invalidateQueries({ queryKey: menuKeys.all });
        },
    });
}

/** @see {@link updateCategoryOrderFn} */
export function useUpdateCategoryOrder() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            displayOrder,
        }: {
            id: string;
            displayOrder: number;
        }) => updateCategoryOrderFn({ data: { id, displayOrder } }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: menuKeys.categories() });
        },
    });
}
