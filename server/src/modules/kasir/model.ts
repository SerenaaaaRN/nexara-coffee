import { t } from "elysia";
import { serverTableQuery } from "../../lib/schema.js";

export const expectedCashQuery = t.Object({
	branchId: t.String({ minLength: 1 }),
	date: t.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}$" }),
});

export const setoransQuery = t.Composite([
	t.Object({
		branch: t.Optional(t.String()),
		status: t.Optional(t.String()),
	}),
	serverTableQuery,
]);

export const createSetoranSchema = t.Object({
	amount: t.Number({ minimum: 0, exclusiveMinimum: 0 }),
	date: t.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}$" }),
	notes: t.Optional(t.String({ maxLength: 500 })),
});

export const approveSetoranSchema = t.Object({
	notes: t.Optional(t.String({ maxLength: 500 })),
});

export const kasirCreateBody = t.Object({
	branchId: t.String({ minLength: 1 }),
	formData: createSetoranSchema,
});

export const kasirApproveBody = t.Object({
	formData: approveSetoranSchema,
});
