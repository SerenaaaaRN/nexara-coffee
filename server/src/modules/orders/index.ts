import { Elysia } from "elysia";
import { betterAuth } from "../../plugins/auth.js";
import {
	cancelOrderBody,
	createOrderSchema,
	getOrdersQuery,
	orderIdParams,
	updateStatusBody,
} from "./model.js";
import {
	cancelOrder,
	createOrder,
	getOrderDetail,
	getOrders,
	updateOrderStatus,
} from "./service.js";

export const orders = new Elysia({ prefix: "/orders" })
	.use(betterAuth)
	.get(
		"/",
		async ({ query, user }) =>
			getOrders(user as { id: string; role: string }, query as never),
		{ query: getOrdersQuery, auth: true, detail: { tags: ["orders"] } },
	)
	.get(
		"/:id",
		async ({ params, user }) =>
			getOrderDetail(user as { id: string; role: string }, params.id),
		{ params: orderIdParams, auth: true, detail: { tags: ["orders"] } },
	)
	.post(
		"/",
		async ({ body, user }) =>
			createOrder(user as { id: string; role: string }, body as never),
		{
			body: createOrderSchema as never,
			auth: true,
			detail: { tags: ["orders"] },
		},
	)
	.post(
		"/:id/status",
		async ({ params, body, user }) =>
			updateOrderStatus(user as { id: string; role: string }, {
				orderId: params.id,
				status: (body as { status: string }).status,
			}),
		{
			params: orderIdParams,
			body: updateStatusBody as never,
			auth: true,
			detail: { tags: ["orders"] },
		},
	)
	.post(
		"/:id/cancel",
		async ({ params, body, user }) =>
			cancelOrder(user as { id: string; role: string }, {
				orderId: params.id,
				reason: (body as { reason?: string })?.reason,
			}),
		{
			params: orderIdParams,
			body: cancelOrderBody as never,
			auth: true,
			detail: { tags: ["orders"] },
		},
	);
