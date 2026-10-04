import { Elysia } from "elysia";
import { betterAuth } from "../../plugins/auth.js";
import {
	createEmployeeBody,
	employeeIdParams,
	updateEmployeeBody,
} from "./model.js";
import {
	createEmployee,
	deleteEmployee,
	getAvailableUsers,
	getBranchesForEmployee,
	getEmployees,
	updateEmployee,
} from "./service.js";

export const employee = new Elysia({ prefix: "/employees" })
	.use(betterAuth)
	.get(
		"/",
		async ({ user }) => getEmployees(user as { id: string; role: string }),
		{
			auth: true,
			detail: { tags: ["employees"] },
		},
	)
	.get(
		"/available-users",
		async ({ user }) => getAvailableUsers(user as { id: string; role: string }),
		{
			auth: true,
			detail: { tags: ["employees"] },
		},
	)
	.get(
		"/branches",
		async ({ user }) =>
			getBranchesForEmployee(user as { id: string; role: string }),
		{
			auth: true,
			detail: { tags: ["employees"] },
		},
	)
	.post(
		"/",
		async ({ body, user }) =>
			createEmployee(user as { id: string; role: string }, body as never),
		{
			body: createEmployeeBody,
			auth: true,
			detail: { tags: ["employees"] },
		},
	)
	.put(
		"/:id",
		async ({ params, body, user }) =>
			updateEmployee(
				user as { id: string; role: string },
				params.id,
				body as never,
			),
		{
			params: employeeIdParams,
			body: updateEmployeeBody,
			auth: true,
			detail: { tags: ["employees"] },
		},
	)
	.delete(
		"/:id",
		async ({ params, user }) =>
			deleteEmployee(user as { id: string; role: string }, params.id),
		{
			params: employeeIdParams,
			auth: true,
			detail: { tags: ["employees"] },
		},
	);
