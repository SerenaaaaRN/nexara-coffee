import * as Ably from "ably";
import { getAblyTokenFn } from "@/hooks/useAblyToken";

let client: Ably.Realtime | null = null;

export function getRealtimeClient(): Ably.Realtime {
    if (typeof window === "undefined") {
        throw new Error("getRealtimeClient() can only be called on the client");
    }
    if (!client) {
        client = new Ably.Realtime({
            authCallback: async (_data, callback) => {
                try {
                    const token = await getAblyTokenFn();
                    callback(null, token);
                } catch (err) {
                    callback(
                        err instanceof Error ? err.message : String(err),
                        null,
                    );
                }
            },
            echoMessages: false,
        });
    }
    return client;
}
