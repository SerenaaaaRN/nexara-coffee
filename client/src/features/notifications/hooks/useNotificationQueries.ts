import { queryOptions } from "@tanstack/react-query";
import { notificationKeys } from "@/features/query-keys";
import { api, type Envelope, toEnvelope } from "@/lib/eden";
import type { NotificationRow } from "../types";

/**
 * Mengambil daftar notifikasi milik user yang sedang login.
 *
 * Diurutkan berdasarkan waktu dibuat (terbaru dulu).
 * `createdAt` sudah ISO string dari server (boundary JSON-safe).
 */
export const getNotifications = async (): Promise<
    Envelope<NotificationRow[]>
> => {
    const { data, error } = await api.notifications.get();
    return toEnvelope(data, error);
};

export function notificationsOptions() {
    return queryOptions({
        queryKey: notificationKeys.lists(),
        queryFn: () => getNotifications(),
    });
}
