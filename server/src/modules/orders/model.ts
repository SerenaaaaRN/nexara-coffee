import { t } from "elysia";

export const ORDER_STATUSES = [
	"pending",
	"confirmed",
	"preparing",
	"completed",
	"cancelled",
] as const;

export const getOrdersQuery = t.Object({
	branchId: t.Optional(t.String()),
	status: t.Optional(t.UnionEnum([...ORDER_STATUSES] as [string, ...string[]])),
	dateFrom: t.Optional(t.String()),
	dateTo: t.Optional(t.String()),
});


export const createOrderSchema = t.Object({
	branchId: t.String({ minLength: 1 }),
	customerId: t.Optional(t.String()),
	items: t.Array(
		t.Object({
			menuItemId: t.String({ minLength: 1 }),
			name: t.String({ minLength: 1 }),
			price: t.Number({ minimum: 0, exclusiveMinimum: 0 }),
			variant: t.Optional(t.String()),
			qty: t.Number({ minimum: 1 }),
		}),
		{ minItems: 1 },
	),
});

export const updateStatusBody = t.Object({
	status: t.UnionEnum([...ORDER_STATUSES] as [string, ...string[]]),
});

export const cancelOrderBody = t.Object({
	reason: t.Optional(t.String({ maxLength: 500 })),
});
