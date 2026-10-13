import { infiniteQueryOptions, useInfiniteQuery } from "@tanstack/react-query";
import { notificationKeys } from "@/features/query-keys";
import { api, toEnvelope } from "@/lib/eden";
import type { NotificationRow } from "../types";

export type NotificationFilters = {
    filter?: "read" | "unread";
};

/**
 * Mengambil satu halaman notifikasi milik user yang sedang login.
 * Filter tab + page di-resolve di server.
 */
export const getNotifications = async (
    params: NotificationFilters,
    page: number,
) => {
    const { data, error } = await api.notifications.get({
        query: {
            filter: params.filter,
            page,
            pageSize: 30,
        },
    });
    return toEnvelope(data, error);
};

export const notificationsInfiniteOptions = (params: NotificationFilters) => {
    return infiniteQueryOptions({
        queryKey: notificationKeys.list(params),
        queryFn: ({ pageParam }) => getNotifications(params, pageParam),
        initialPageParam: 0,
        getNextPageParam: (lastPage) =>
            lastPage.success
                ? (lastPage.data.nextPage ?? undefined)
                : undefined,
    });
};

export const useNotificationsInfinite = (params: NotificationFilters) => {
    return useInfiniteQuery(notificationsInfiniteOptions(params));
};

export type { NotificationRow };
