/**
 * Helper murni untuk tabel server-driven (tanpa I/O, tanpa Elysia).
 * Dipakai service untuk membangun kondisi `ilike` dari `q`.
 */

/** Escape wildcard LIKE (`%`, `_`, `\`) agar `q` user selalu literal. */
export const escapeLikePattern = (input: string) =>
	input.replace(/[\\%_]/g, (m) => `\\${m}`);

/** Bungkus term yang sudah di-escape menjadi pola `%term%` untuk `ilike`. */
export const containsPattern = (term: string) =>
	`%${escapeLikePattern(term)}%`;
