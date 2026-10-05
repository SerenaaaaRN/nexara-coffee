import { useCallback, useEffect, useRef } from "react";
import { getRealtimeClient } from "@/lib/realtime";

/**
 * Mengelola indikator "sedang mengetik" via Ably realtime.
 * Event berhenti otomatis (debounce) setelah 3 detik tanpa aktivitas.
 *
 * @param channelId - ID channel chat aktif
 * @param currentUserId - ID user saat ini
 * @param currentUserName - Nama user saat ini
 * @returns Fungsi trigger `startTyping` dan `stopTyping`
 */
export function useChatTyping(
    channelId: string | null,
    currentUserId: string,
    currentUserName: string,
) {
    const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const stopTyping = useCallback(() => {
        if (!channelId) return;
        try {
            const ably = getRealtimeClient();
            ably.channels
                .get(`chat:channel:${channelId}`)
                .publish("typing:stop", { userId: currentUserId });
        } catch {
            // non-critical
        }
        if (typingTimeout.current) {
            clearTimeout(typingTimeout.current);
            typingTimeout.current = null;
        }
    }, [channelId, currentUserId]);

    const startTyping = useCallback(() => {
        if (!channelId) return;
        if (debounceRef.current) return;
        debounceRef.current = setTimeout(() => {
            debounceRef.current = null;
        }, 3000);

        try {
            const ably = getRealtimeClient();
            ably.channels
                .get(`chat:channel:${channelId}`)
                .publish("typing:start", {
                    userId: currentUserId,
                    userName: currentUserName,
                });
        } catch {
            // non-critical
        }
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(stopTyping, 2000);
    }, [channelId, currentUserId, currentUserName, stopTyping]);

    useEffect(() => {
        return () => {
            if (typingTimeout.current) clearTimeout(typingTimeout.current);
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    return { startTyping, stopTyping };
}
