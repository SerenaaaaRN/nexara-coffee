import { t } from "elysia";

export const myOrdersQuery = t.Object({
	page: t.Optional(t.Numeric({ minimum: 0 })),
	pageSize: t.Optional(t.Numeric({ minimum: 1, maximum: 50 })),
});

export const createMyReviewBody = t.Object({
	orderId: t.String({ minLength: 1 }),
	rating: t.Number({ minimum: 1, maximum: 5 }),
	comment: t.Optional(t.String({ maxLength: 500 })),
});

export const updateMyPhoneBody = t.Object({
	phone: t.String({ minLength: 1, maxLength: 15 }),
});
