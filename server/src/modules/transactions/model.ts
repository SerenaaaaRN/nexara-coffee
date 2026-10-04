import { t } from "elysia";

export const transactionIdParams = t.Object({ id: t.String({ minLength: 1 }) });

export const recordTransactionBody = t.Object({
	orderId: t.String({ minLength: 1 }),
	branchId: t.String({ minLength: 1 }),
	paymentMethod: t.String({ minLength: 1 }),
	amount: t.Numeric({ minimum: 0 }),
});

export const refundTransactionBody = t.Object({
	transactionId: t.String({ minLength: 1 }),
	reason: t.Optional(t.String({ maxLength: 500 })),
});
