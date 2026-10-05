import { treaty } from "@elysiajs/eden";
import type { App } from "../../../server/src/app";

/**
 * Konektor resmi client → Elysia (Eden Treaty).
 */
export const api = treaty<App>(window.location.origin).api;

export type Envelope<T> =
    | { success: true; data: T }
    | { success: false; error: string };

/** Ambil `data` dari envelope sukses. */
export type EnvelopeData<T> = T extends { success: true; data: infer D }
    ? D
    : never;

/**
 * Turunkan tipe entity dari method treaty 
 * Contoh: `GetData<typeof api.branches.get>` untuk list, `[number]` untuk item.
 */
export type GetData<
    T extends (...args: never[]) => Promise<{ data: unknown }>,
> = EnvelopeData<Awaited<ReturnType<T>>["data"]>;

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
		const v = error.value as
			| { success?: unknown; error?: unknown; message?: unknown }
			| undefined;
		if (
			v !== null &&
			typeof v === "object" &&
			v.success === false &&
			typeof v.error === "string"
		) {
			return { success: false as const, error: v.error };
		}
		const message =
			v !== null && typeof v === "object" && typeof v.message === "string"
				? v.message
				: `Request failed (${String(error.status)})`;
		return { success: false as const, error: message };
	}
	return (
		(data as Envelope<T>) ?? {
			success: false as const,
			error: "Empty response",
		}
	);
};
