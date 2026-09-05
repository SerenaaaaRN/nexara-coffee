import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import type { z } from "zod";
import { notificationKeys } from "@/features/query-keys";
import { markAllReadSchema, markReadSchema } from "../types";

/**
 * Menandai satu notifikasi sebagai sudah dibaca.
 *
 * Hanya pemilik notifikasi yang boleh menandainya.
 *
 * @param id - id notifikasi
 * @returns {null} Tanpa data balikan
 */
export const markNotificationReadFn = createServerFn({ method: "POST" })
    .validator(markReadSchema)
    .handler(async ({ data: { id } }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("update", "notifications");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { supabaseAdmin } = await import("@database/server");

        const { data: target, error: targetError } = await supabaseAdmin
            .from("notifications")
            .select("user_id")
            .eq("id", id)
            .maybeSingle();

        if (targetError || !target)
            return {
                success: false as const,
                error: targetError?.message ?? "Notification not found",
            };

        if (target.user_id !== auth.session.user.id) {
            return { success: false as const, error: "Forbidden" };
        }

        const { error } = await supabaseAdmin
            .from("notifications")
            .update({ is_read: true })
            .eq("id", id);

        if (error) return { success: false as const, error: error.message };

        return { success: true as const, data: null };
    });

/**
 * Menandai semua notifikasi milik user sebagai sudah dibaca.
 *
 * @returns {null} Tanpa data balikan
 */
export const markAllReadFn = createServerFn({ method: "POST" })
    .validator(markAllReadSchema)
    .handler(async () => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("update", "notifications");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { supabaseAdmin } = await import("@database/server");

        const { error } = await supabaseAdmin
            .from("notifications")
            .update({ is_read: true })
            .eq("user_id", auth.session.user.id)
            .eq("is_read", false);

        if (error) return { success: false as const, error: error.message };

        return { success: true as const, data: null };
    });

export function useMarkNotificationRead() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: z.infer<typeof markReadSchema>) =>
            markNotificationReadFn({ data }),
        onSuccess: (res) => {
            if (res.success) {
                queryClient.invalidateQueries({
                    queryKey: notificationKeys.lists(),
                });
            }
        },
    });
}

export function useMarkAllRead() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: z.infer<typeof markAllReadSchema>) =>
            markAllReadFn({ data }),
        onSuccess: (res) => {
            if (res.success) {
                queryClient.invalidateQueries({
                    queryKey: notificationKeys.lists(),
                });
            }
        },
    });
}
