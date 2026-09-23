import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { chatKeys } from "@/features/query-keys";
import type {
    ChannelRow,
    ChatChannelJoined,
    ChatMessageJoined,
    MessageRow,
} from "../types";

const RATE = { messages: 30, users: 20 } as const;

/**
 * Mengambil daftar channel chat yang dapat diakses oleh user.
 *
 * @returns Daftar channel (termasuk pesan terakhir dan jumlah member).
 */
export const getUserChannelsFn = createServerFn({ method: "GET" }).handler(
    async () => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("read", "chat");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { rateLimit } = await import("@/lib/rate-limit");
        if (!rateLimit(`chat:channels:${auth.session.user.id}`, 10, 60_000)) {
            return { success: false as const, error: "Too many requests" };
        }

        const { getAccessibleBranchIds } = await import("@/utils/branch-scope");
        const branchIds = await getAccessibleBranchIds(
            auth.session.user.id,
            auth.session.user.role,
        );

        const { supabaseAdmin } = await import("@database/server");
        const me = auth.session.user.id;

        const { data: channels, error: channelsError } = await supabaseAdmin
            .from("chat_channels")
            .select(
                "id, type, branch_id, name, created_at, branches!chat_channels_branch_id_branches_id_fk(id, name)",
            )
            .order("created_at", { ascending: false });

        if (channelsError)
            return { success: false as const, error: channelsError.message };

        const { data: myMemberships, error: membershipError } =
            await supabaseAdmin
                .from("chat_channel_members")
                .select("channel_id")
                .eq("user_id", me);

        if (membershipError)
            return { success: false as const, error: membershipError.message };

        const myChannelIds = new Set(
            (myMemberships ?? []).map((m) => m.channel_id),
        );

        const channelRows = (channels ?? []) as unknown as ChatChannelJoined[];

        const visible = channelRows.filter((c) => {
            if (c.type === "direct") return myChannelIds.has(c.id);
            if (branchIds === null) return true;
            if (branchIds.length === 0) return c.type === "global";
            return (
                c.type === "global" ||
                (c.branch_id !== null && branchIds.includes(c.branch_id))
            );
        });

        const visibleIds = visible.map((c) => c.id);

        const lastByChannel = new Map<
            string,
            { content: string; senderName: string; createdAt: Date }
        >();
        const countByChannel = new Map<string, number>();

        if (visibleIds.length > 0) {
            const [{ data: messages }, { data: members }] = await Promise.all([
                supabaseAdmin
                    .from("chat_messages")
                    .select(
                        "channel_id, content, created_at, sender:user!chat_messages_sender_id_user_id_fk(id, name)",
                    )
                    .in("channel_id", visibleIds)
                    .order("created_at", { ascending: false })
                    .limit(visibleIds.length * 5),
                supabaseAdmin
                    .from("chat_channel_members")
                    .select("channel_id")
                    .in("channel_id", visibleIds),
            ]);

            for (const m of (messages ??
                []) as unknown as ChatMessageJoined[]) {
                if (!lastByChannel.has(m.channel_id)) {
                    lastByChannel.set(m.channel_id, {
                        content: m.content,
                        senderName: m.sender?.name ?? "Unknown",
                        createdAt: new Date(m.created_at),
                    });
                }
            }

            for (const m of members ?? []) {
                countByChannel.set(
                    m.channel_id,
                    (countByChannel.get(m.channel_id) ?? 0) + 1,
                );
            }
        }

        const rows: ChannelRow[] = visible.map((c) => ({
            id: c.id,
            type: c.type,
            branchId: c.branch_id,
            name: c.name,
            createdAt: c.created_at,
            branchName: c.branches?.name ?? null,
            lastMessage: lastByChannel.get(c.id) ?? null,
            memberCount: countByChannel.get(c.id) ?? 0,
        }));

        rows.sort((a, b) => {
            const aTime =
                a.lastMessage?.createdAt.getTime() ??
                new Date(a.createdAt).getTime();
            const bTime =
                b.lastMessage?.createdAt.getTime() ??
                new Date(b.createdAt).getTime();
            return bTime - aTime;
        });

        return { success: true as const, data: rows satisfies ChannelRow[] };
    },
);

/**
 * Mengambil daftar pesan dari suatu channel.
 *
 * @param channelId - ID channel chat
 * @param before - Opsional, batas waktu (cursor) untuk mengambil pesan yang lebih lama
 * @param limit - Opsional, batas jumlah pesan yang diambil (default 50)
 * @returns Daftar pesan dan flag hasMore
 */
export const getChannelMessagesFn = createServerFn({ method: "GET" })
    .validator(
        z.object({
            channelId: z.string(),
            before: z.string().optional(),
            limit: z.number().default(50),
        }),
    )
    .handler(async ({ data: { channelId, before, limit } }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("read", "chat");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { rateLimit } = await import("@/lib/rate-limit");
        if (
            !rateLimit(
                `chat:messages:${auth.session.user.id}`,
                RATE.messages,
                60_000,
            )
        ) {
            return { success: false as const, error: "Too many requests" };
        }

        const { supabaseAdmin } = await import("@database/server");

        let messagesQuery = supabaseAdmin
            .from("chat_messages")
            .select(
                "id, channel_id, sender_id, content, created_at, sender:user!chat_messages_sender_id_user_id_fk(id, name, image)",
            )
            .eq("channel_id", channelId)
            .order("created_at", { ascending: false })
            .limit(limit + 1);

        if (before) {
            messagesQuery = messagesQuery.lt(
                "created_at",
                new Date(before).toISOString(),
            );
        }

        const { data, error } = await messagesQuery;
        if (error) return { success: false as const, error: error.message };

        const rows = (data ?? []) as unknown as ChatMessageJoined[];
        const hasMore = rows.length > limit;
        const messages: MessageRow[] = (hasMore ? rows.slice(0, limit) : rows)
            .reverse()
            .map((m) => ({
                id: m.id,
                channelId: m.channel_id,
                senderId: m.sender_id,
                content: m.content,
                createdAt: new Date(m.created_at),
                senderName: m.sender?.name ?? null,
                senderImage: m.sender?.image ?? null,
                isOwn: false, // Client side hook will set this properly
            }));

        return { success: true as const, data: { messages, hasMore } };
    });

/**
 * Mengambil daftar seluruh user (kecuali diri sendiri) yang bisa dihubungi via Direct Message.
 *
 * @returns Daftar user (id, name, email, image)
 */
export const getAvailableUsersFn = createServerFn({ method: "GET" }).handler(
    async () => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("read", "chat");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { rateLimit } = await import("@/lib/rate-limit");
        if (
            !rateLimit(`chat:users:${auth.session.user.id}`, RATE.users, 60_000)
        ) {
            return { success: false as const, error: "Too many requests" };
        }

        const { supabaseAdmin } = await import("@database/server");

        const { data, error } = await supabaseAdmin
            .from("user")
            .select("id, name, email, image")
            .neq("id", auth.session.user.id)
            .order("name");

        if (error) return { success: false as const, error: error.message };

        return { success: true as const, data: data ?? [] };
    },
);

/** @see {@link getUserChannelsFn} */
export function userChannelsOptions() {
    return queryOptions({
        queryKey: chatKeys.channels(),
        queryFn: () => getUserChannelsFn(),
        staleTime: 0,
    });
}

/** @see {@link getAvailableUsersFn} */
export function availableUsersOptions() {
    return queryOptions({
        queryKey: chatKeys.availableUsers(),
        queryFn: () => getAvailableUsersFn(),
        staleTime: 0,
    });
}
