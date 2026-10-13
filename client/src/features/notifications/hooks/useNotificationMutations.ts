import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import { notificationKeys } from "@/features/query-keys";
import { api, type Envelope, toEnvelope } from "@/lib/eden";
import type { markAllReadSchema, markReadSchema } from "../types";

/**
 * Menandai satu notifikasi sebagai sudah dibaca.
 * Hanya pemilik notifikasi yang boleh menandainya.
 */
export const markNotificationRead = async (
    input: z.infer<typeof markReadSchema>,
): Promise<Envelope<unknown>> => {
    const { data, error } = await api
        .notifications({ id: input.id })
        .read.post();
    return toEnvelope(data, error);
};

/**
 * Menandai semua notifikasi milik user sebagai sudah dibaca.
 */
export const markAllRead = async (): Promise<Envelope<unknown>> => {
    const { data, error } = await api.notifications["read-all"].post();
    return toEnvelope(data, error);
};

export const useMarkNotificationRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: z.infer<typeof markReadSchema>) =>
            markNotificationRead(data),
        onSuccess: (res) => {
            if (res.success) {
                queryClient.invalidateQueries({
                    queryKey: notificationKeys.lists(),
                });
            }
        },
    });
};

export const useMarkAllRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (_data: z.infer<typeof markAllReadSchema>) => markAllRead(),
        onSuccess: (res) => {
            if (res.success) {
                queryClient.invalidateQueries({
                    queryKey: notificationKeys.lists(),
                });
            }
        },
    });
};
