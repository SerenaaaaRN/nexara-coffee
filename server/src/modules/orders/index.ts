import { Elysia } from "elysia";
import { authPlugin } from "../../plugins/auth.js";
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
	.use(authPlugin)
	.get("/", async ({ query, user }) => getOrders(user, query as never), {
		query: getOrdersQuery,
		requireRole: ["orders", "read"],
		detail: { tags: ["orders"] },
	})
	.get("/:id", async ({ params, user }) => getOrderDetail(user, params.id), {
		params: orderIdParams,
		requireRole: ["orders", "read"],
		detail: { tags: ["orders"] },
	})
	.post("/", async ({ body, user }) => createOrder(user, body as never), {
		body: createOrderSchema as never,
		requireRole: ["orders", "create"],
		detail: { tags: ["orders"] },
	})
	.post(
		"/:id/status",
		async ({ params, body, user }) =>
			updateOrderStatus(user, {
				orderId: params.id,
				status: (body as { status: string }).status,
			}),
		{
			params: orderIdParams,
			body: updateStatusBody as never,
			requireRole: ["orders", "update"],
			detail: { tags: ["orders"] },
		},
	)
	.post(
		"/:id/cancel",
		async ({ params, body, user }) =>
			cancelOrder(user, {
				orderId: params.id,
				reason: (body as { reason?: string })?.reason,
			}),
		{
			params: orderIdParams,
			body: cancelOrderBody as never,
			requireRole: ["orders", "update"],
			detail: { tags: ["orders"] },
		},
	);
