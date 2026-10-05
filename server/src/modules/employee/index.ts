import { Elysia } from "elysia";
import { authPlugin } from "../../plugins/auth.js";
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
	.use(authPlugin)
	.get("/", async ({ user }) => getEmployees(user), {
		requireRole: ["employee", "read"],
		detail: { tags: ["employees"] },
	})
	.get("/available-users", async ({ user }) => getAvailableUsers(user), {
		requireRole: ["employee", "read"],
		detail: { tags: ["employees"] },
	})
	.get("/branches", async ({ user }) => getBranchesForEmployee(user), {
		requireRole: ["employee", "read"],
		detail: { tags: ["employees"] },
	})
	.post("/", async ({ body, user }) => createEmployee(user, body as never), {
		body: createEmployeeBody,
		requireRole: ["employee", "create"],
		detail: { tags: ["employees"] },
	})
	.put(
		"/:id",
		async ({ params, body, user }) => updateEmployee(user, params.id, body as never),
		{
			params: employeeIdParams,
			body: updateEmployeeBody,
			requireRole: ["employee", "update"],
			detail: { tags: ["employees"] },
		},
	)
	.delete("/:id", async ({ params, user }) => deleteEmployee(user, params.id), {
		params: employeeIdParams,
		requireRole: ["employee", "delete"],
		detail: { tags: ["employees"] },
	});
