import { t } from "elysia";

export const idParams = t.Object({ id: t.String({ minLength: 1 }) });

export const pageResult = <T>(
	rows: T[],
	total: number,
	page: number,
	pageSize: number,
) => ({
	rows,
	total,
	nextPage: (page + 1) * pageSize < total ? page + 1 : null,
});

/**
 * Kontrak query standar untuk tabel server-driven: search + paging + sort.
 * Dipakai via Composite di setiap modul list (contoh: orders).
 * `page/pageSize/sortBy/sortDir` opsional — default diselesaikan di
 * `resolveTableParams()` agar tidak bergantung injeksi default Elysia.
 */
export const serverTableQuery = t.Object({
	q: t.Optional(t.String({ maxLength: 100 })),
	page: t.Optional(t.Numeric({ minimum: 0 })),
	pageSize: t.Optional(t.Numeric({ minimum: 1, maximum: 50 })),
	sortBy: t.Optional(t.String({ maxLength: 32 })),
	sortDir: t.Optional(t.UnionEnum(["asc", "desc"])),
});

export type TableSortDir = "asc" | "desc";

/** Normalisasi + clamp param tabel (single source untuk default page/pageSize/sortDir). */
export const resolveTableParams = (params?: {
	page?: number;
	pageSize?: number;
	sortDir?: string;
}) => {
	const rawSize = params?.pageSize ?? 20;
	return {
		page: Math.max(0, params?.page ?? 0),
		pageSize: Math.min(50, Math.max(1, rawSize)),
		sortDir: (params?.sortDir === "asc" ? "asc" : "desc") as TableSortDir,
	};
};
