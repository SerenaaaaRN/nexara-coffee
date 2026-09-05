import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { chatKeys } from "@/features/query-keys";
import { createDirectChannelSchema, sendMessageSchema } from "../types";

/**
 * Mengirim pesan ke dalam channel chat.
 * Juga akan mem-publish event realtime melalui Ably.
 *
 * @param channelId - ID channel chat
 * @param content - Isi pesan
 * @returns Data pesan yang baru dibuat
 */
export const sendMessageFn = createServerFn({ method: "POST" })
    .validator(sendMessageSchema.extend({ channelId: z.string() }))
    .handler(async ({ data: { channelId, ...data } }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("create", "chat");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { rateLimit } = await import("@/lib/rate-limit");
        if (!rateLimit(`chat:send:${auth.session.user.id}`, 20, 60_000)) {
            return { success: false as const, error: "Too many requests" };
        }

        const { supabaseAdmin } = await import("@database/server");

        const { data: message, error } = await supabaseAdmin
            .from("chat_messages")
            .insert({
                id: crypto.randomUUID(),
                channel_id: channelId,
                sender_id: auth.session.user.id,
                content: data.content,
            })
            .select()
            .single();

        if (error || !message)
            return {
                success: false as const,
                error: error?.message ?? "Gagal mengirim pesan",
            };

        const messageData = {
            id: message.id,
            channelId: message.channel_id,
            senderId: message.sender_id,
            content: message.content,
            createdAt: new Date(message.created_at).toISOString(),
            senderName: auth.session.user.name,
            senderImage: auth.session.user.image,
        };

        try {
            const { getAblyRest } = await import("@/lib/ably.server");
            const ably = getAblyRest();
            await ably.channels
                .get(`chat:channel:${channelId}`)
                .publish("message", messageData);
        } catch {
            console.warn("Ably publish failed (non-critical)");
        }

        return { success: true as const, data: messageData };
    });

/**
 * Membuat channel Direct Message (DM) dengan user lain.
 * Jika channel DM sudah ada, akan mengembalikan ID channel yang sudah ada.
 *
 * @param targetUserId - ID user yang akan dichat
 * @returns ID channel yang dibuat atau ditemukan
 */
export const createDirectChannelFn = createServerFn({ method: "POST" })
    .validator(createDirectChannelSchema)
    .handler(async ({ data: { targetUserId } }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("create", "chat");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { rateLimit } = await import("@/lib/rate-limit");
        if (!rateLimit(`chat:create-dm:${auth.session.user.id}`, 10, 60_000)) {
            return { success: false as const, error: "Too many requests" };
        }

        if (targetUserId === auth.session.user.id) {
            return {
                success: false as const,
                error: "Cannot create DM with yourself",
            };
        }

        const { supabaseAdmin } = await import("@database/server");
        const me = auth.session.user.id;

        const [{ data: myMemberships }, { data: targetMemberships }] =
            await Promise.all([
                supabaseAdmin
                    .from("chat_channel_members")
                    .select("channel_id")
                    .eq("user_id", me),
                supabaseAdmin
                    .from("chat_channel_members")
                    .select("channel_id")
                    .eq("user_id", targetUserId),
            ]);

        const myChannelIds = new Set(
            (myMemberships ?? []).map((m) => m.channel_id),
        );
        const sharedIds = (targetMemberships ?? [])
            .map((m) => m.channel_id)
            .filter((id) => myChannelIds.has(id));

        if (sharedIds.length > 0) {
            const { data: existing, error } = await supabaseAdmin
                .from("chat_channels")
                .select("id")
                .eq("type", "direct")
                .in("id", sharedIds)
                .limit(1)
                .maybeSingle();

            if (error) return { success: false as const, error: error.message };
            if (existing) {
                return { success: true as const, data: existing.id };
            }
        }

        const { data: targetUser, error: targetError } = await supabaseAdmin
            .from("user")
            .select("name")
            .eq("id", targetUserId)
            .maybeSingle();

        if (targetError)
            return { success: false as const, error: targetError.message };

        const { data: channel, error: channelError } = await supabaseAdmin
            .from("chat_channels")
            .insert({
                id: crypto.randomUUID(),
                type: "direct",
                name: targetUser?.name ?? "Unknown",
            })
            .select()
            .single();

        if (channelError || !channel)
            return {
                success: false as const,
                error: channelError?.message ?? "Gagal membuat channel",
            };

        const { error: membersError } = await supabaseAdmin
            .from("chat_channel_members")
            .insert([
                {
                    id: crypto.randomUUID(),
                    channel_id: channel.id,
                    user_id: me,
                },
                {
                    id: crypto.randomUUID(),
                    channel_id: channel.id,
                    user_id: targetUserId,
                },
            ]);

        if (membersError)
            return { success: false as const, error: membersError.message };

        return { success: true as const, data: channel.id };
    });

/** @see {@link sendMessageFn} */
export function useSendMessage() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (
            data: z.infer<typeof sendMessageSchema> & { channelId: string },
        ) => sendMessageFn({ data }),
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

/** @see {@link createDirectChannelFn} */
export function useCreateDirectChannel() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: z.infer<typeof createDirectChannelSchema>) =>
            createDirectChannelFn({ data }),
        onSuccess: (res) => {
            if (res.success) {
                queryClient.invalidateQueries({
                    queryKey: chatKeys.channels(),
                });
            }
        },
    });
}
