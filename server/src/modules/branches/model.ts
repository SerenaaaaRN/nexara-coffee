import { t } from "elysia";

export const branchIdParams = t.Object({ id: t.String({ minLength: 1 }) });

export const createBranchSchema = t.Object({
	name: t.String({ minLength: 2, maxLength: 100 }),
	address: t.String({ minLength: 5, maxLength: 500 }),
	lat: t.Optional(t.Union([t.String(), t.Null()])),
	lng: t.Optional(t.Union([t.String(), t.Null()])),
	phone: t.Optional(t.Union([t.String(), t.Null()])),
	openingTime: t.Optional(t.Union([t.String(), t.Null()])),
	closingTime: t.Optional(t.Union([t.String(), t.Null()])),
	status: t.Optional(t.String()),
	ownershipType: t.Optional(t.String()),
	managerId: t.Optional(t.Union([t.String(), t.Null()])),
});

export const updateBranchSchema = t.Partial(createBranchSchema);

export const assignFranchiseSchema = t.Object({
	userId: t.String({ minLength: 1 }),
	branchId: t.String({ minLength: 1 }),
	commissionRate: t.Optional(t.Numeric({ minimum: 0, maximum: 100 })),
});
