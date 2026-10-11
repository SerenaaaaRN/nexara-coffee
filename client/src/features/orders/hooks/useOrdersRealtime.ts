import { useQueryClient } from "@tanstack/react-query";
import * as Ably from "ably";
import { useEffect, useRef } from "react";
import { orderKeys } from "@/features/query-keys";
import { getAblyToken } from "@/hooks/useAblyToken";

/**
 * Hook untuk berlangganan channel "orders" melalui Ably Realtime.
 * Ketika ada event update, otomatis membatalkan (invalidate) query orders di TanStack Query
 * sehingga UI (table/board) akan fetching ulang dan mendapatkan data terbaru secara real-time.
 */
export function useOrdersRealtime() {
    const queryClient = useQueryClient();
    const ablyRef = useRef<Ably.Realtime | null>(null);

    useEffect(() => {
        if (ablyRef.current) return;

        const client = new Ably.Realtime({
            authCallback: async (_data, callback) => {
                try {
                    const token = await getAblyToken();
                    callback(null, token);
                } catch (err) {
                    callback(
                        err instanceof Error ? err.message : String(err),
                        null,
                    );
                }
            },
        });

        ablyRef.current = client;

        const channel = client.channels.get("orders");

        // Debounce invalidasi agar rentetan event (multiple order update) hanya
        // memicu satu refetch, bukan satu refetch per event.
        let debounceTimer: ReturnType<typeof setTimeout> | undefined;
        const handler = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                // Invalidate semua query orders agar UI sinkron
                queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
            }, 150);
        };

        channel.subscribe("order-created", handler);
        channel.subscribe("order-updated", handler);
        channel.subscribe("order-cancelled", handler);

        return () => {
            clearTimeout(debounceTimer);
            channel.unsubscribe();
            try {
                void Promise.resolve(client.close()).catch(() => {});
            } catch {
                // abaikan error cleanup Ably
            }
            ablyRef.current = null;
        };
    }, [queryClient]);
}
