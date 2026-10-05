import { t } from "elysia";

export const idParams = t.Object({ id: t.String({ minLength: 1 }) });

export const paginationQuery = t.Object({
	page: t.Numeric({ default: 0, minimum: 0 }),
	pageSize: t.Numeric({ default: 20, minimum: 1, maximum: 50 }),
});

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
