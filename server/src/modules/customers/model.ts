import { t } from "elysia";

export const customerIdParams = t.Object({ id: t.String({ minLength: 1 }) });

export const createCustomerBody = t.Object({
	fullName: t.String({ minLength: 2, maxLength: 100 }),
	email: t.Optional(t.String({ format: "email" })),
	phone: t.Optional(t.String()),
	segment: t.Optional(t.String()),
});

export const updateCustomerBody = t.Object({
	fullName: t.Optional(t.String({ minLength: 2 })),
	email: t.Optional(t.Union([t.String({ format: "email" }), t.Null()])),
	phone: t.Optional(t.Union([t.String(), t.Null()])),
	segment: t.Optional(t.String()),
});

export const findOrCreateBody = t.Object({
	fullName: t.String({ minLength: 1, maxLength: 255 }),
	phone: t.Optional(t.String()),
});

export const loyaltyBody = t.Object({
	points: t.Number({ minimum: 0 }),
});
