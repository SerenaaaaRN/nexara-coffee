import { asc, desc, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import type { TableSortDir } from "./schema.js";

export type SortColumnMap = Record<string, PgColumn>;

export const isSortColumn = <M extends SortColumnMap>(
	map: M,
	value: string,
): value is keyof M & string => value in map;

export const toSort = <M extends SortColumnMap>(
	map: M,
	sortBy: string | undefined,
	dir: TableSortDir,
	fallback: SQL,
) => {
	if (sortBy && isSortColumn(map, sortBy)) {
		const col = map[sortBy];
		return dir === "asc" ? asc(col) : desc(col);
	}
	return fallback;
};
