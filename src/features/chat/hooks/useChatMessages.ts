import type { InboundMessage, RealtimeChannel } from "ably";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSendMessage } from "@/features/chat/hooks/useChatMutations";
import { getChannelMessagesFn } from "@/features/chat/hooks/useChatQueries";
import { getRealtimeClient } from "@/lib/realtime";
import type { MessageRow } from "../types";

interface UseChatMessagesOptions {
    channelId: string;
    currentUserId: string;
    onRefresh: () => void;
}

interface UseChatMessagesReturn {
    allMessages: MessageRow[];
    messageGroups: { dateKey: string; messages: MessageRow[] }[];
    isLoadingMessages: boolean;
    isLoadingMore: boolean;
    hasMore: boolean;
    typingUserNames: string[];
    handleLoadMore: () => Promise<void>;
    sendMessage: (content: string) => Promise<boolean>;
}

/**
 * Mengelola state pesan chat: realtime subscription (Ably), initial load, load more, send message.
 *
 * @returns State pesan, derived groups, loading status, dan fungsi send/loadMore
 */
export function useChatMessages({
    channelId,
    currentUserId,
    onRefresh,
}: UseChatMessagesOptions): UseChatMessagesReturn {
    const [allMessages, setAllMessages] = useState<MessageRow[]>([]);
    const [isLoadingMessages, setIsLoadingMessages] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [typingUserNames, setTypingUserNames] = useState<string[]>([]);
    const channelRef = useRef<RealtimeChannel | null>(null);
    const typingUsersRef = useRef<Map<string, string>>(new Map());
    const typingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
        new Map(),
    );
    const earliestRef = useRef<string | null>(null);
    const sendMessageMutation = useSendMessage();

    /** Ably realtime: subscribe "message", "typing:start", "typing:stop". Cleanup otomatis. */
    useEffect(() => {
        const updateTypingDisplay = () => {
            setTypingUserNames(Array.from(typingUsersRef.current.values()));
        };

        const releaseTypingTimer = (userId: string) => {
            const timer = typingTimersRef.current.get(userId);
            if (timer) {
                clearTimeout(timer);
                typingTimersRef.current.delete(userId);
            }
        };

        try {
            const ably = getRealtimeClient();
            const ablyChannel = ably.channels.get(`chat:channel:${channelId}`);
            channelRef.current = ablyChannel;

            ablyChannel.subscribe("message", (msg: InboundMessage) => {
                const data = msg.data as {
                    id: string;
                    channelId: string;
                    senderId: string;
                    content: string;
                    createdAt: string;
                    senderName: string;
                    senderImage: string | null;
                };

                setAllMessages((prev) => {
                    if (prev.some((m) => m.id === data.id)) return prev;
                    return [
                        ...prev,
                        {
                            id: data.id,
                            channelId: data.channelId,
                            senderId: data.senderId,
                            content: data.content,
                            createdAt: new Date(data.createdAt),
                            senderName: data.senderName,
                            senderImage: data.senderImage,
                            isOwn: data.senderId === currentUserId,
                        },
                    ];
                });

                onRefresh?.();
            });

            ablyChannel.subscribe("typing:start", (msg: InboundMessage) => {
                const data = msg.data as { userId: string; userName: string };
                if (data.userId === currentUserId) return;

                typingUsersRef.current.set(data.userId, data.userName);
                releaseTypingTimer(data.userId);
                typingTimersRef.current.set(
                    data.userId,
                    setTimeout(() => {
                        typingTimersRef.current.delete(data.userId);
                        if (typingUsersRef.current.delete(data.userId)) {
                            updateTypingDisplay();
                        }
                    }, 3000),
                );

                updateTypingDisplay();
            });

            ablyChannel.subscribe("typing:stop", (msg: InboundMessage) => {
                const data = msg.data as { userId: string };
                releaseTypingTimer(data.userId);
                if (typingUsersRef.current.delete(data.userId)) {
                    updateTypingDisplay();
                }
            });
        } catch (err) {
            console.warn("Ably connection failed", err);
        }

        return () => {
            if (channelRef.current) {
                channelRef.current.unsubscribe("message");
                channelRef.current.unsubscribe("typing:start");
                channelRef.current.unsubscribe("typing:stop");
                channelRef.current = null;
            }
            for (const timer of typingTimersRef.current.values()) {
                clearTimeout(timer);
            }
            typingTimersRef.current.clear();
            typingUsersRef.current.clear();
            setTypingUserNames([]);
        };
    }, [channelId, currentUserId, onRefresh]);

    /** Fetch data awal dari server pas channel ganti. Reset state + set loading. */
    useEffect(() => {
        setAllMessages([]);
        setHasMore(true);
        setIsLoadingMessages(true);
        earliestRef.current = null;
        getChannelMessagesFn({ data: { channelId } })
            .then((result) => {
                if (!result.success) return;
                setAllMessages(
                    (result.data.messages ?? []).map((m: MessageRow) => ({
                        ...m,
                        createdAt: new Date(m.createdAt),
                    })),
                );
                const first = result.data.messages?.[0];
                earliestRef.current = first
                    ? new Date(first.createdAt).toISOString()
                    : null;
                setHasMore(result.data.hasMore ?? false);
            })
            .catch(console.error)
            .finally(() => setIsLoadingMessages(false));
    }, [channelId]);

    /** Load pesan lebih lama (cursor-based, pake createdAt pesan teratas). */
    const handleLoadMore = useCallback(async () => {
        if (!hasMore || isLoadingMore || !earliestRef.current) return;
        setIsLoadingMore(true);
        try {
            const result = await getChannelMessagesFn({
                data: { channelId, before: earliestRef.current },
            });
            if (!result.success) return;
            setHasMore(result.data.hasMore ?? false);
            setAllMessages((prev) => {
                const older = (result.data.messages ?? []).map(
                    (m: MessageRow) => ({
                        ...m,
                        createdAt: new Date(m.createdAt),
                    }),
                );
                if (older.length > 0) {
                    earliestRef.current = older[0].createdAt.toISOString();
                }
                return [...older, ...prev];
            });
        } catch (err) {
            console.error("Failed to load more", err);
        } finally {
            setIsLoadingMore(false);
        }
    }, [channelId, hasMore, isLoadingMore]);

    /**
     * Kirim pesan baru.
     * Optimistic: langsung push ke allMessages, rollback kalo gagal.
     *
     * @returns true kalo sukses, false kalo gagal
     */
    const sendMessage = useCallback(
        async (content: string): Promise<boolean> => {
            try {
                const result = await sendMessageMutation.mutateAsync({
                    channelId,
                    content,
                });
                if (result.success) {
                    setAllMessages((prev) => {
                        if (prev.some((m) => m.id === result.data.id))
                            return prev;
                        return [
                            ...prev,
                            {
                                id: result.data.id,
                                channelId: result.data.channelId,
                                senderId: result.data.senderId,
                                content: result.data.content,
                                createdAt: new Date(result.data.createdAt),
                                senderName: result.data.senderName,
                                senderImage: result.data.senderImage ?? null,
                                isOwn: true,
                            },
                        ];
                    });
                    return true;
                }
                return false;
            } catch {
                return false;
            }
        },
        [channelId, sendMessageMutation],
    );

    /** Group pesan berdasarkan tanggal (toDateString) buat separator "Today", "Yesterday", dll. */
    const messageGroups = useMemo(() => {
        const groups: { dateKey: string; messages: MessageRow[] }[] = [];
        for (const msg of allMessages) {
            const key = msg.createdAt.toDateString();
            const last = groups[groups.length - 1];
            if (last && last.dateKey === key) {
                last.messages.push(msg);
            } else {
                groups.push({ dateKey: key, messages: [msg] });
            }
        }
        return groups;
    }, [allMessages]);

    return {
        allMessages,
        messageGroups,
        isLoadingMessages,
        isLoadingMore,
        hasMore,
        typingUserNames,
        handleLoadMore,
        sendMessage,
    };
}
