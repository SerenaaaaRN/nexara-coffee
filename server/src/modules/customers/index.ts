import { Elysia } from "elysia";
import { idParams } from "../../lib/schema.js";
import { authPlugin } from "../../plugins/auth.js";
import {
	createCustomerBody,
	findOrCreateBody,
	lookupCustomerBody,
	loyaltyBody,
	updateCustomerBody,
} from "./model.js";
import {
	createCustomer,
	deleteCustomer,
	findOrCreateCustomer,
	getCustomers,
	lookupCustomerByPhone,
	updateCustomer,
	updateLoyaltyPoints,
} from "./service.js";

export const customers = new Elysia({ prefix: "/customers" })
	.use(authPlugin)
	.model({
		"customers.params": idParams,
		"customers.create": createCustomerBody,
		"customers.update": updateCustomerBody,
		"customers.findOrCreate": findOrCreateBody,
		"customers.lookup": lookupCustomerBody,
		"customers.loyalty": loyaltyBody,
	})
	.get("/", async () => getCustomers(), {
		requireRole: ["customers", "read"],
		detail: { tags: ["customers"] },
	})
	.post("/", async ({ body, user }) => createCustomer(user, body), {
		body: "customers.create",
		requireRole: ["customers", "create"],
		detail: { tags: ["customers"] },
	})
	.post(
		"/find-or-create",
		async ({ body, user }) =>
			findOrCreateCustomer(user, body.fullName, body.phone),
		{
			body: "customers.findOrCreate",
			requireRole: ["customers", "create"],
			detail: { tags: ["customers"] },
		},
	)
	.post(
		"/lookup",
		async ({ body, user }) => lookupCustomerByPhone(user, body.phone),
		{
			body: "customers.lookup",
			requireRole: ["customers", "create"],
			detail: { tags: ["customers"] },
		},
	)
	.put(
		"/:id",
		async ({ params, body, user }) => updateCustomer(user, params.id, body),
		{
			params: "customers.params",
			body: "customers.update",
			requireRole: ["customers", "update"],
			detail: { tags: ["customers"] },
		},
	)
	.delete("/:id", async ({ params, user }) => deleteCustomer(user, params.id), {
		params: "customers.params",
		requireRole: ["customers", "delete"],
		detail: { tags: ["customers"] },
	})
	.patch(
		"/:id/loyalty",
		async ({ params, body, user }) =>
			updateLoyaltyPoints(user, params.id, body.points),
		{
			params: "customers.params",
			body: "customers.loyalty",
			requireRole: ["customers", "update"],
			detail: { tags: ["customers"] },
		},
	);
