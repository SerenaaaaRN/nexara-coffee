import { t } from "elysia";

export const employeeIdParams = t.Object({ id: t.String({ minLength: 1 }) });

export const createEmployeeBody = t.Object({
	userId: t.String({ minLength: 1 }),
	branchId: t.String({ minLength: 1 }),
	baseSalary: t.Numeric({ minimum: 0 }),
	hireDate: t.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}$" }),
});

export const updateEmployeeBody = t.Object({
	branchId: t.Optional(t.String()),
	baseSalary: t.Optional(t.Numeric({ minimum: 0 })),
	hireDate: t.Optional(t.String()),
});
