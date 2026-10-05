import { t } from "elysia";


export const recordTransactionBody = t.Object({
	orderId: t.String({ minLength: 1 }),
	branchId: t.String({ minLength: 1 }),
	paymentMethod: t.String({ minLength: 1 }),
	amount: t.Number({ minimum: 0 }),
});
