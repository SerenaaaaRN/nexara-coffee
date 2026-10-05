import type { InboundMessage } from "ably";
import { useEffect, useRef } from "react";
import { getRealtimeClient } from "@/lib/realtime";

interface NotificationEvent {
    id: string;
    type: string;
    title: string;
    body: string | null;
    createdAt: string;
}

type NotificationCallback = (notification: NotificationEvent) => void;

/**
 * Notifikasi realtime via Ably.
 * Subscribe ke channel `notifications:user:{userId}` untuk menerima
 * notifikasi baru secara langsung.
 */
export function useNotificationsRealtime(
    userId: string | null,
    onNotification?: NotificationCallback,
) {
    const callbackRef = useRef(onNotification);
    callbackRef.current = onNotification;

    useEffect(() => {
        if (!userId) return;

        try {
            const ably = getRealtimeClient();
            const channel = ably.channels.get(`notifications:user:${userId}`);

            const handler = (msg: InboundMessage) => {
                const data = msg.data as NotificationEvent;
                callbackRef.current?.(data);
            };

            channel.subscribe("notification", handler).catch(() => {
                console.warn(
                    "Ably notification subscription failed (non-critical)",
                );
            });

            return () => {
                channel.unsubscribe("notification", handler);
                channel.detach().catch(() => {});
            };
        } catch {
            console.warn("Ably realtime init failed (non-critical)");
        }
    }, [userId]);
}
