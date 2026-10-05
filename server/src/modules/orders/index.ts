import { Elysia } from "elysia";
import { authPlugin } from "../../plugins/auth.js";
import { idParams } from "../../lib/schema.js";
import {
	cancelOrderBody,
	createOrderSchema,
	getOrdersQuery,
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
	.model({
		"orders.query": getOrdersQuery,
		"orders.params": idParams,
		"orders.create": createOrderSchema,
		"orders.status": updateStatusBody,
		"orders.cancel": cancelOrderBody,
	})
	.get("/", async ({ query, user }) => getOrders(user, query), {
		query: "orders.query",
		requireRole: ["orders", "read"],
		detail: { tags: ["orders"] },
	})
	.get("/:id", async ({ params, user }) => getOrderDetail(user, params.id), {
		params: "orders.params",
		requireRole: ["orders", "read"],
		detail: { tags: ["orders"] },
	})
	.post("/", async ({ body, user }) => createOrder(user, body), {
		body: "orders.create",
		requireRole: ["orders", "create"],
		detail: { tags: ["orders"] },
	})
	.post(
		"/:id/status",
		async ({ params, body, user }) =>
			updateOrderStatus(user, { orderId: params.id, status: body.status }),
		{
			params: "orders.params",
			body: "orders.status",
			requireRole: ["orders", "update"],
			detail: { tags: ["orders"] },
		},
	)
	.post(
		"/:id/cancel",
		async ({ params, body, user }) =>
			cancelOrder(user, { orderId: params.id, reason: body.reason }),
		{
			params: "orders.params",
			body: "orders.cancel",
			requireRole: ["orders", "update"],
			detail: { tags: ["orders"] },
		},
	);
