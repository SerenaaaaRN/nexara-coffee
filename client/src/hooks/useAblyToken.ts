import { api, toEnvelope } from "@/lib/eden";

/**
 * Meminta Ably TokenRequest untuk user yang login.
 * Dipakai global untuk Chat, Notifications, dan Orders via authCallback.
 */
export const getAblyToken = async () => {
    const { data, error } = await api.ably.token.post();
    const envelope = toEnvelope(data, error);
    if (!envelope.success) throw new Error(envelope.error);
    return envelope.data;
};
