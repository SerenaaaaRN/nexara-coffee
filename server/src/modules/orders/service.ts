import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../../db/index.js";
import { user as userTable } from "../../db/schema/auth-schema.js";
import { branches } from "../../db/schema/branches.js";
import { customers } from "../../db/schema/customers.js";
import { menuItems } from "../../db/schema/menu.js";
import { orderItems, orders } from "../../db/schema/orders.js";
import type { CurrentUser } from "../../lib/auth-user.js";
import { fail, ok } from "../../lib/response.js";
import { publishAbly } from "../../utils/effects.js";
import { earnedPointsForTotal, tierForPoints } from "../../utils/loyalty.js";
import {
	assertBranchAccess,
	emptyScope,
	getAccessibleBranchIds,
} from "../../utils/scope.js";

const guardTerminalTransition = (
	current: string,
	action: "update" | "cancel",
) => {
	if (current === "cancelled") return fail(400, "Order is already cancelled");
	if (current === "completed")
		return fail(
			400,
			action === "cancel"
				? "Cannot cancel a completed order"
				: "Cannot change a completed order",
		);
	return null;
};

export const getOrders = async (
	user: CurrentUser,
	params: {
		branchId?: string;
		status?: string;
		dateFrom?: string;
		dateTo?: string;
	},
) => {
	const ids = await getAccessibleBranchIds(user.id, user.role);

	if (emptyScope(ids)) {
		return ok([]);
	}

	const createdByUser = alias(userTable, "created_by_user");
	const conditions = [];

	if (params.branchId) {
		if (ids !== null && !ids.includes(params.branchId)) {
			return ok([]);
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

	return ok(data);
};

export const getOrderDetail = async (user: CurrentUser, orderId: string) => {
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
		return fail(404, "Order not found");
	}

	const ids = await getAccessibleBranchIds(user.id, user.role);
	const denied = assertBranchAccess(ids, order.branchId);
	if (denied) return denied;

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

	return ok({ ...order, items });
};

export const createOrder = async (
	user: CurrentUser,
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
	const ids = await getAccessibleBranchIds(user.id, user.role);
	const denied = assertBranchAccess(ids, parsed.branchId);
	if (denied) return denied;

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

	void publishAbly("orders", "order-created", { orderId });

	return ok({ id: orderId, orderNumber });
};

export const updateOrderStatus = async (
	user: CurrentUser,
	parsed: { orderId: string; status: string },
) => {
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
		return fail(404, "Order not found");
	}

	const denied = assertBranchAccess(ids, existing.branchId);
	if (denied) return denied;

	const terminal = guardTerminalTransition(existing.status, "update");
	if (terminal) return terminal;

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

	void publishAbly("orders", "order-updated", { orderId: order.id });

	return ok(order);
};

export const cancelOrder = async (
	user: CurrentUser,
	parsed: { orderId: string; reason?: string },
) => {
	const [[existing], ids] = await Promise.all([
		db
			.select({ branchId: orders.branchId, status: orders.status })
			.from(orders)
			.where(eq(orders.id, parsed.orderId))
			.limit(1),
		getAccessibleBranchIds(user.id, user.role),
	]);

	if (!existing) {
		return fail(404, "Order not found");
	}

	const denied = assertBranchAccess(ids, existing.branchId);
	if (denied) return denied;

	const terminal = guardTerminalTransition(existing.status, "cancel");
	if (terminal) return terminal;

	const [order] = await db
		.update(orders)
		.set({ status: "cancelled" })
		.where(eq(orders.id, parsed.orderId))
		.returning();

	void publishAbly("orders", "order-cancelled", { orderId: order.id });

	return ok(order);
};
