import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { status } from "elysia";
import { db } from "../../db/index.js";
import { user as userTable } from "../../db/schema/auth-schema.js";
import { branches } from "../../db/schema/branches.js";
import { customers } from "../../db/schema/customers.js";
import { menuItems } from "../../db/schema/menu.js";
import { orderItems, orders } from "../../db/schema/orders.js";
import { getAblyRest } from "../../lib/ably.server.js";
import { can, type Role } from "../../lib/rbac.js";
import { getAccessibleBranchIds } from "../../utils/branch-scope.js";
import { earnedPointsForTotal, tierForPoints } from "../../utils/loyalty.js";

export const getOrders = async (
	user: { id: string; role: string },
	params: {
		branchId?: string;
		status?: string;
		dateFrom?: string;
		dateTo?: string;
	},
) => {
	if (!can(user.role as Role, "read", "orders")) {
		return status(403, { success: false as const, error: "Forbidden" });
	}

	const ids = await getAccessibleBranchIds(user.id, user.role);

	if (ids !== null && ids.length === 0) {
		return { success: true as const, data: [] };
	}

	const createdByUser = alias(userTable, "created_by_user");
	const conditions = [];

	if (params.branchId) {
		if (ids !== null && !ids.includes(params.branchId)) {
			return { success: true as const, data: [] };
		}
		conditions.push(eq(orders.branchId, params.branchId));
	} else if (ids !== null && ids.length > 0) {
		conditions.push(inArray(orders.branchId, ids));
	}

	if (params.status) {
		conditions.push(eq(orders.status, params.status));
	}
	if (params.dateFrom) {
		conditions.push(gte(orders.createdAt, new Date(params.dateFrom)));
	}
	if (params.dateTo) {
		conditions.push(lte(orders.createdAt, new Date(params.dateTo)));
	}

	const data = await db
		.select({
			id: orders.id,
			branchId: orders.branchId,
			customerId: orders.customerId,
			orderNumber: orders.orderNumber,
			status: orders.status,
			totalAmount: orders.totalAmount,
			createdBy: orders.createdBy,
			createdAt: orders.createdAt,
			branchName: branches.name,
			customerName: customers.fullName,
			createdByName: createdByUser.name,
		})
		.from(orders)
		.leftJoin(branches, eq(orders.branchId, branches.id))
		.leftJoin(customers, eq(orders.customerId, customers.id))
		.leftJoin(createdByUser, eq(orders.createdBy, createdByUser.id))
		.where(conditions.length > 0 ? and(...conditions) : undefined)
		.orderBy(desc(orders.createdAt));

	return { success: true as const, data };
};

export const getOrderDetail = async (
	user: { id: string; role: string },
	orderId: string,
) => {
	if (!can(user.role as Role, "read", "orders")) {
		return status(403, { success: false as const, error: "Forbidden" });
	}

	const createdByUser = alias(userTable, "created_by_user");

	const [order] = await db
		.select({
			id: orders.id,
			branchId: orders.branchId,
			customerId: orders.customerId,
			orderNumber: orders.orderNumber,
			status: orders.status,
			totalAmount: orders.totalAmount,
			createdBy: orders.createdBy,
			createdAt: orders.createdAt,
			branchName: branches.name,
			customerName: customers.fullName,
			createdByName: createdByUser.name,
		})
		.from(orders)
		.leftJoin(branches, eq(orders.branchId, branches.id))
		.leftJoin(customers, eq(orders.customerId, customers.id))
		.leftJoin(createdByUser, eq(orders.createdBy, createdByUser.id))
		.where(eq(orders.id, orderId))
		.limit(1);

	if (!order) {
		return status(404, { success: false as const, error: "Order not found" });
	}

	const ids = await getAccessibleBranchIds(user.id, user.role);
	if (ids !== null && !ids.includes(order.branchId)) {
		return status(403, {
			success: false as const,
			error: "Forbidden branch access",
		});
	}

	const items = await db
		.select({
			id: orderItems.id,
			orderId: orderItems.orderId,
			menuItemId: orderItems.menuItemId,
			nameSnapshot: orderItems.nameSnapshot,
			priceSnapshot: orderItems.priceSnapshot,
			variantSnapshot: orderItems.variantSnapshot,
			qty: orderItems.qty,
			subtotal: orderItems.subtotal,
			menuItemName: menuItems.name,
		})
		.from(orderItems)
		.leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
		.where(eq(orderItems.orderId, orderId));

	return { success: true as const, data: { ...order, items } };
};

export const createOrder = async (
	user: { id: string; role: string },
	parsed: {
		branchId: string;
		customerId?: string;
		items: {
			menuItemId: string;
			name: string;
			price: number;
			variant?: string;
			qty: number;
		}[];
	},
) => {
	if (!can(user.role as Role, "create", "orders")) {
		return status(403, { success: false as const, error: "Forbidden" });
	}

	const ids = await getAccessibleBranchIds(user.id, user.role);
	if (ids !== null && !ids.includes(parsed.branchId)) {
		return status(403, {
			success: false as const,
			error: "Forbidden branch access",
		});
	}

	const orderId = crypto.randomUUID();
	const total = parsed.items.reduce(
		(sum, i) => sum + Number(i.price) * i.qty,
		0,
	);
	const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
	const orderNumber = `ORD-${dateStr}-${orderId.slice(0, 4).toUpperCase()}`;

	await db.insert(orders).values({
		id: orderId,
		branchId: parsed.branchId,
		customerId: parsed.customerId ?? null,
		orderNumber,
		status: "pending",
		totalAmount: String(total),
		createdBy: user.id,
	});

	await db.insert(orderItems).values(
		parsed.items.map((item) => ({
			id: crypto.randomUUID(),
			orderId,
			menuItemId: item.menuItemId,
			nameSnapshot: item.variant ? `${item.name} (${item.variant})` : item.name,
			priceSnapshot: String(item.price),
			variantSnapshot: item.variant ?? null,
			qty: item.qty,
			subtotal: String(Number(item.price) * item.qty),
		})),
	);

	try {
		const ably = getAblyRest();
		ably.channels.get("orders").publish("order-created", { orderId });
	} catch (e) {
		console.error("Ably publish failed:", e);
	}

	return { success: true as const, data: { id: orderId, orderNumber } };
};

export const updateOrderStatus = async (
	user: { id: string; role: string },
	parsed: { orderId: string; status: string },
) => {
	if (!can(user.role as Role, "update", "orders")) {
		return status(403, { success: false as const, error: "Forbidden" });
	}

	const [[existing], ids] = await Promise.all([
		db
			.select({
				branchId: orders.branchId,
				status: orders.status,
				customerId: orders.customerId,
				totalAmount: orders.totalAmount,
			})
			.from(orders)
			.where(eq(orders.id, parsed.orderId))
			.limit(1),
		getAccessibleBranchIds(user.id, user.role),
	]);

	if (!existing) {
		return status(404, { success: false as const, error: "Order not found" });
	}

	if (ids !== null && !ids.includes(existing.branchId)) {
		return status(403, {
			success: false as const,
			error: "Forbidden branch access",
		});
	}

	if (existing.status === "cancelled") {
		return status(400, {
			success: false as const,
			error: "Order is already cancelled",
		});
	}

	if (existing.status === "completed") {
		return status(400, {
			success: false as const,
			error: "Cannot change a completed order",
		});
	}

	const [order] = await db
		.update(orders)
		.set({ status: parsed.status })
		.where(eq(orders.id, parsed.orderId))
		.returning();

	if (parsed.status === "completed" && existing.customerId) {
		try {
			const [profile] = await db
				.select({ loyaltyPoints: customers.loyaltyPoints })
				.from(customers)
				.where(eq(customers.id, existing.customerId))
				.limit(1);
			if (profile) {
				const next =
					(profile.loyaltyPoints ?? 0) +
					earnedPointsForTotal(existing.totalAmount);
				await db
					.update(customers)
					.set({
						loyaltyPoints: next,
						loyaltyTier: tierForPoints(next),
					} as never)
					.where(eq(customers.id, existing.customerId));
			}
		} catch (accrueError) {
			console.error("Gagal akrual poin loyalty:", accrueError);
		}
	}

	try {
		const ably = getAblyRest();
		ably.channels.get("orders").publish("order-updated", { orderId: order.id });
	} catch (e) {
		console.error("Ably publish failed:", e);
	}

	return { success: true as const, data: order };
};

export const cancelOrder = async (
	user: { id: string; role: string },
	parsed: { orderId: string; reason?: string },
) => {
	if (!can(user.role as Role, "update", "orders")) {
		return status(403, { success: false as const, error: "Forbidden" });
	}

	const [[existing], ids] = await Promise.all([
		db
			.select({ branchId: orders.branchId, status: orders.status })
			.from(orders)
			.where(eq(orders.id, parsed.orderId))
			.limit(1),
		getAccessibleBranchIds(user.id, user.role),
	]);

	if (!existing) {
		return status(404, { success: false as const, error: "Order not found" });
	}

	if (ids !== null && !ids.includes(existing.branchId)) {
		return status(403, {
			success: false as const,
			error: "Forbidden branch access",
		});
	}

	if (existing.status === "completed") {
		return status(400, {
			success: false as const,
			error: "Cannot cancel a completed order",
		});
	}

	if (existing.status === "cancelled") {
		return status(400, {
			success: false as const,
			error: "Order is already cancelled",
		});
	}

	const [order] = await db
		.update(orders)
		.set({ status: "cancelled" })
		.where(eq(orders.id, parsed.orderId))
		.returning();

	try {
		const ably = getAblyRest();
		ably.channels
			.get("orders")
			.publish("order-cancelled", { orderId: order.id });
	} catch (e) {
		console.error("Ably publish failed:", e);
	}

	return { success: true as const, data: order };
};
