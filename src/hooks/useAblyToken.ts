import { createServerFn } from "@tanstack/react-start";

/**
 * Server function untuk mendapatkan Ably TokenRequest.
 * Memerlukan autentikasi user, dapat digunakan secara global untuk Chat, Notifications, dan Orders.
 *
 * @returns TokenRequest object untuk Ably Realtime authCallback
 * @throws Error jika user tidak terautentikasi
 */
export const getAblyTokenFn = createServerFn({ method: "POST" }).handler(
    async () => {
        const { getAblyRest } = await import("@/lib/ably.server");
        const { getSession } = await import("@/lib/with-auth.server");

        const session = await getSession();
        if (!session?.user) {
            throw new Error("Unauthorized");
        }

        const ably = getAblyRest();
        const tokenRequest = await ably.auth.createTokenRequest({
            clientId: session.user.id,
        });

        return tokenRequest;
    },
);
