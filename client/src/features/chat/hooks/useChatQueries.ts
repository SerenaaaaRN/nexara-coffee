import { queryOptions } from "@tanstack/react-query";
import { chatKeys } from "@/features/query-keys";
import { api, toEnvelope } from "@/lib/eden";

/**
 * Mengambil daftar channel chat yang dapat diakses oleh user.
 */
export const getUserChannels = async () => {
    const { data, error } = await api.chat.channels.get();
    return toEnvelope(data, error);
};

/**
 * Mengambil daftar pesan dari suatu channel.
 */
export const getChannelMessages = async (input: {
    channelId: string;
    before?: string;
    limit?: number;
}) => {
    const { data, error } = await api.chat
        .channels({ id: input.channelId })
        .messages.get({
            query: { before: input.before, limit: input.limit ?? 50 },
        });
    return toEnvelope(data, error);
};

/**
 * Mengambil daftar seluruh user (kecuali diri sendiri) yang bisa dihubungi via Direct Message.
 */
export const getAvailableUsers = async () => {
    const { data, error } = await api.chat["available-users"].get();
    return toEnvelope(data, error);
};

export function userChannelsOptions() {
    return queryOptions({
        queryKey: chatKeys.channels(),
        queryFn: () => getUserChannels(),
        staleTime: 0,
    });
}

export function availableUsersOptions() {
    return queryOptions({
        queryKey: chatKeys.availableUsers(),
        queryFn: () => getAvailableUsers(),
        staleTime: 0,
    });
}
