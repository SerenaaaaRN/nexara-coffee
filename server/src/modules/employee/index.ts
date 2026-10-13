import { Elysia } from "elysia";
import { idParams } from "../../lib/schema.js";
import { authPlugin } from "../../plugins/auth.js";
import { createEmployeeBody, getEmployeesQuery, updateEmployeeBody } from "./model.js";
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
	.model({
		"employee.query": getEmployeesQuery,
		"employee.params": idParams,
		"employee.create": createEmployeeBody,
		"employee.update": updateEmployeeBody,
	})
	.get("/", async ({ query, user }) => getEmployees(user, query), {
		query: "employee.query",
		requireRole: ["employee", "read"],
		detail: { tags: ["employees"] },
	})
	.get("/available-users", async () => getAvailableUsers(), {
		requireRole: ["employee", "read"],
		detail: { tags: ["employees"] },
	})
	.get("/branches", async () => getBranchesForEmployee(), {
		requireRole: ["employee", "read"],
		detail: { tags: ["employees"] },
	})
	.post("/", async ({ body, user }) => createEmployee(user, body), {
		body: "employee.create",
		requireRole: ["employee", "create"],
		detail: { tags: ["employees"] },
	})
	.put("/:id", async ({ params, body, user }) =>
		updateEmployee(user, params.id, body),
	{
		params: "employee.params",
		body: "employee.update",
		requireRole: ["employee", "update"],
		detail: { tags: ["employees"] },
	},
	)
	.delete("/:id", async ({ params, user }) => deleteEmployee(user, params.id), {
		params: "employee.params",
		requireRole: ["employee", "delete"],
		detail: { tags: ["employees"] },
	});
