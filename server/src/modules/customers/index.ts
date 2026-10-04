import { Elysia } from "elysia";
import { betterAuth } from "../../plugins/auth.js";
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
	.use(betterAuth)
	.get(
		"/",
		async ({ user }) => getCustomers(user as { id: string; role: string }),
		{
			auth: true,
			detail: { tags: ["customers"] },
		},
	)
	.post(
		"/",
		async ({ body, user }) =>
			createCustomer(user as { id: string; role: string }, body as never),
		{
			body: createCustomerBody,
			auth: true,
			detail: { tags: ["customers"] },
		},
	)
	.post(
		"/find-or-create",
		async ({ body, user }) =>
			findOrCreateCustomer(
				user as { id: string; role: string },
				(body as { fullName: string }).fullName,
				(body as { phone?: string }).phone,
			),
		{
			body: findOrCreateBody,
			auth: true,
			detail: { tags: ["customers"] },
		},
	)
	.put(
		"/:id",
		async ({ params, body, user }) =>
			updateCustomer(
				user as { id: string; role: string },
				params.id,
				body as never,
			),
		{
			params: customerIdParams,
			body: updateCustomerBody,
			auth: true,
			detail: { tags: ["customers"] },
		},
	)
	.delete(
		"/:id",
		async ({ params, user }) =>
			deleteCustomer(user as { id: string; role: string }, params.id),
		{
			params: customerIdParams,
			auth: true,
			detail: { tags: ["customers"] },
		},
	)
	.patch(
		"/:id/loyalty",
		async ({ params, body, user }) =>
			updateLoyaltyPoints(
				user as { id: string; role: string },
				params.id,
				(body as { points: number }).points,
			),
		{
			params: customerIdParams,
			body: loyaltyBody,
			auth: true,
			detail: { tags: ["customers"] },
		},
	);
