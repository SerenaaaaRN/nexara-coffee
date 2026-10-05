import { t } from "elysia";

export const createEmployeeBody = t.Object({
	userId: t.String({ minLength: 1 }),
	branchId: t.String({ minLength: 1 }),
	baseSalary: t.Number({ minimum: 0 }),
	hireDate: t.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}$" }),
});

export const updateEmployeeBody = t.Object({
	branchId: t.Optional(t.String()),
	baseSalary: t.Optional(t.Number({ minimum: 0 })),
	hireDate: t.Optional(t.String()),
});
