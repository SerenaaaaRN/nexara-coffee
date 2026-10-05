import { treaty } from "@elysiajs/eden";
import type { App } from "../../../server/src/app";

/**
 * Konektor resmi client → Elysia (Eden Treaty).
 */
export const api = treaty<App>(window.location.origin).api;

export type Envelope<T> =
    | { success: true; data: T }
    | { success: false; error: string };

/**
 * Memetakan respons Eden `{ data, error }` ke envelope `{ success, data }`
 * yang dipakai hooks. `fail()` server (400/401/403/404/409/429/500) masuk
 * jalur `error` (status >= 300 → `data = null`).
 */
export const toEnvelope = <T>(
    data: Envelope<T> | null | undefined,
    error: { status: number | string; value: unknown } | null,
): Envelope<T> => {
    if (error) {
        const v = error.value as Envelope<T> | undefined;
        return (
            v ?? {
                success: false as const,
                error: `Request failed (${String(error.status)})`,
            }
        );
    }
    return (
        (data as Envelope<T>) ?? {
            success: false as const,
            error: "Empty response",
        }
    );
};
