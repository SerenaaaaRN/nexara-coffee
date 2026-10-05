import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { notificationKeys } from "@/features/query-keys";
import type { NotificationRow } from "../types";

/**
 * Mengambil daftar notifikasi milik user yang sedang login.
 *
 * Diurutkan berdasarkan waktu dibuat (terbaru dulu).
 *
 * @returns {NotificationRow[]} Daftar notifikasi milik user
 */
export const getNotificationsFn = createServerFn({ method: "GET" }).handler(
    async () => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("read", "notifications");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { supabaseAdmin } = await import("@database/server");

        const { data, error } = await supabaseAdmin
            .from("notifications")
            .select("id, user_id, type, title, body, is_read, created_at")
            .eq("user_id", auth.session.user.id)
            .order("created_at", { ascending: false });

        if (error) return { success: false as const, error: error.message };

        const rows: NotificationRow[] = (data ?? []).map((n) => ({
            id: n.id,
            userId: n.user_id,
            type: n.type,
            title: n.title,
            body: n.body,
            isRead: n.is_read,
            createdAt: n.created_at,
        }));

        return { success: true as const, data: rows };
    },
);

export function notificationsOptions() {
    return queryOptions({
        queryKey: notificationKeys.lists(),
        queryFn: () => getNotificationsFn(),
    });
}
