import { t } from "elysia";
import { serverTableQuery } from "../../lib/schema.js";

export const getTransactionsQuery = t.Composite([
	t.Object({
		branchId: t.Optional(t.String()),
		paymentMethod: t.Optional(t.String()),
		status: t.Optional(t.String()),
		dateFrom: t.Optional(t.String()),
		dateTo: t.Optional(t.String()),
	}),
	serverTableQuery,
]);

export const recordTransactionBody = t.Object({
	orderId: t.String({ minLength: 1 }),
	branchId: t.String({ minLength: 1 }),
	paymentMethod: t.String({ minLength: 1 }),
	amount: t.Number({ minimum: 0 }),
});
