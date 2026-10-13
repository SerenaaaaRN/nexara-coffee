import { t } from "elysia";
import { serverTableQuery } from "../../lib/schema.js";

export const payoutsQuery = t.Composite([
	t.Object({
		branchId: t.Optional(t.String()),
		status: t.Optional(t.String()),
	}),
	serverTableQuery,
]);

export const requestPayoutBody = t.Object({
	branchId: t.String({ minLength: 1 }),
	amount: t.Number({ minimum: 0 }),
	periodStart: t.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}$" }),
	periodEnd: t.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}$" }),
});
