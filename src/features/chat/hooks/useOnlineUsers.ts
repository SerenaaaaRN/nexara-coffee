import type { PresenceMessage, RealtimePresence } from "ably";
import { useEffect, useRef, useState } from "react";
import { getRealtimeClient } from "@/lib/realtime";

/**
 * Melacak status kehadiran (presence) user di channel tertentu.
 *
 * @param channelId - ID channel chat aktif
 * @returns Set berisi `clientId` dari user yang sedang online
 */
export function useOnlineUsers(channelId: string | null) {
    const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
    const presenceRef = useRef<RealtimePresence | null>(null);

    useEffect(() => {
        if (!channelId) return;

        try {
            const ably = getRealtimeClient();
            const channel = ably.channels.get(`chat:presence:${channelId}`);
            const presence = channel.presence;
            presenceRef.current = presence;

            presence.subscribe("enter", (member: PresenceMessage) => {
                setOnlineUserIds((prev) => new Set(prev).add(member.clientId));
            });

            presence.subscribe("leave", (member: PresenceMessage) => {
                setOnlineUserIds((prev) => {
                    const next = new Set(prev);
                    next.delete(member.clientId);
                    return next;
                });
            });

            presence.enter();
        } catch {
            // presence is non-critical
        }

        return () => {
            if (presenceRef.current) {
                presenceRef.current.leave();
                presenceRef.current = null;
            }
        };
    }, [channelId]);

    return { onlineUserIds };
}
