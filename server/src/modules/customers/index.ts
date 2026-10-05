import { Elysia } from "elysia";
import { authPlugin } from "../../plugins/auth.js";
import {
	createCustomerBody,
	customerIdParams,
	findOrCreateBody,
	loyaltyBody,
	updateCustomerBody,
} from "./model.js";
import {
	createCustomer,
	deleteCustomer,
	findOrCreateCustomer,
	getCustomers,
	updateCustomer,
	updateLoyaltyPoints,
} from "./service.js";

export const customers = new Elysia({ prefix: "/customers" })
	.use(authPlugin)
	.get("/", async ({ user }) => getCustomers(user), {
		requireRole: ["customers", "read"],
		detail: { tags: ["customers"] },
	})
	.post("/", async ({ body, user }) => createCustomer(user, body as never), {
		body: createCustomerBody,
		requireRole: ["customers", "create"],
		detail: { tags: ["customers"] },
	})
	.post(
		"/find-or-create",
		async ({ body, user }) =>
			findOrCreateCustomer(
				user,
				(body as { fullName: string }).fullName,
				(body as { phone?: string }).phone,
			),
		{
			body: findOrCreateBody,
			requireRole: ["customers", "create"],
			detail: { tags: ["customers"] },
		},
	)
	.put(
		"/:id",
		async ({ params, body, user }) => updateCustomer(user, params.id, body as never),
		{
			params: customerIdParams,
			body: updateCustomerBody,
			requireRole: ["customers", "update"],
			detail: { tags: ["customers"] },
		},
	)
	.delete("/:id", async ({ params, user }) => deleteCustomer(user, params.id), {
		params: customerIdParams,
		requireRole: ["customers", "delete"],
		detail: { tags: ["customers"] },
	})
	.patch(
		"/:id/loyalty",
		async ({ params, body, user }) =>
			updateLoyaltyPoints(user, params.id, (body as { points: number }).points),
		{
			params: customerIdParams,
			body: loyaltyBody,
			requireRole: ["customers", "update"],
			detail: { tags: ["customers"] },
		},
	);
