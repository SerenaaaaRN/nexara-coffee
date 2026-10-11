import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import type {
    createDirectChannelSchema,
    sendMessageSchema,
} from "@/features/chat/types";
import { chatKeys } from "@/features/query-keys";
import { api, toEnvelope } from "@/lib/eden";

/**
 * Mengirim pesan ke dalam channel chat.
 * Juga akan mem-publish event realtime melalui Ably (ditangani server).
 */
export const sendMessage = async (
    input: z.infer<typeof sendMessageSchema> & { channelId: string },
) => {
    const { data, error } = await api.chat.messages.post({
        channelId: input.channelId,
        content: input.content,
    });
    return toEnvelope(data, error);
};

/**
 * Membuat channel Direct Message (DM) dengan user lain.
 * Jika channel DM sudah ada, akan mengembalikan ID channel yang sudah ada.
 */
export const createDirectChannel = async (
    input: z.infer<typeof createDirectChannelSchema>,
) => {
    const { data, error } = await api.chat.channels.direct.post({
        targetUserId: input.targetUserId,
    });
    return toEnvelope(data, error);
};

export function useSendMessage() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (
            data: z.infer<typeof sendMessageSchema> & { channelId: string },
        ) => sendMessage(data),
        onSuccess: (res, variables) => {
            if (res.success) {
                queryClient.invalidateQueries({
                    queryKey: chatKeys.messages(variables.channelId),
                });
                queryClient.invalidateQueries({
                    queryKey: chatKeys.channels(),
                });
            }
        },
    });
}

export function useCreateDirectChannel() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: z.infer<typeof createDirectChannelSchema>) =>
            createDirectChannel(data),
        onSuccess: (res) => {
            if (res.success) {
                queryClient.invalidateQueries({
                    queryKey: chatKeys.channels(),
                });
            }
        },
    });
}
