import type { CurrentUser } from "../../access/index.js";
import {
	assertBranchAccess,
	emptyScope,
	getAccessibleBranchIds,
} from "../../access/index.js";
import { fail, ok } from "../../lib/http.js";
import { pageResult, resolveTableParams } from "../../lib/schema.js";
import { publishAbly } from "../../utils/effects.js";
import { earnedPointsForTotal, tierForPoints } from "../../utils/loyalty.js";
import type { getOrdersQuery } from "./model.js";
import { orderRepo } from "./repository.js";

const emptySummary = { total: 0, pending: 0, completed: 0, cancelled: 0 };

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

const toStatusSummary = (
	total: number,
	counts: { status: string; value: number }[],
) => {
	const summary = { total, pending: 0, completed: 0, cancelled: 0 };
	for (const row of counts) {
		if (row.status === "pending") summary.pending = row.value;
		else if (row.status === "completed") summary.completed = row.value;
		else if (row.status === "cancelled") summary.cancelled = row.value;
	}
	return summary;
};

export const getOrders = async (
	user: CurrentUser,
	params: typeof getOrdersQuery.static,
) => {
	const ids = await getAccessibleBranchIds(user.id, user.role);
	const { page, pageSize, sortDir } = resolveTableParams(params);

	if (emptyScope(ids)) {
		return ok({ ...pageResult([], 0, page, pageSize), summary: emptySummary });
	}
	if (ids !== null && params.branchId && !ids.includes(params.branchId)) {
		return ok({ ...pageResult([], 0, page, pageSize), summary: emptySummary });
	}

	const result = await orderRepo.list({
		ids,
		branchId: params.branchId,
		status: params.status,
		dateFrom: params.dateFrom,
		dateTo: params.dateTo,
		q: params.q,
		sortBy: params.sortBy,
		sortDir,
		page,
		pageSize,
	});

	return ok({
		...pageResult(
			result.rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
			result.total,
			page,
			pageSize,
		),
		summary: toStatusSummary(result.total, result.statusCounts),
	});
};

export const getOrderDetail = async (user: CurrentUser, orderId: string) => {
	const order = await orderRepo.findDetail(orderId);
	if (!order) {
		return fail(404, "Order not found");
	}

	const ids = await getAccessibleBranchIds(user.id, user.role);
	const denied = assertBranchAccess(ids, order.branchId);
	if (denied) return denied;

	const items = await orderRepo.findItems(orderId);

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

	await orderRepo.createFull(
		{
			id: orderId,
			branchId: parsed.branchId,
			customerId: parsed.customerId ?? null,
			orderNumber,
			status: "pending",
			totalAmount: String(total),
			createdBy: user.id,
		},
		parsed.items.map((item) => ({
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
	const [existing, ids] = await Promise.all([
		orderRepo.findStatus(parsed.orderId),
		getAccessibleBranchIds(user.id, user.role),
	]);

	if (!existing) {
		return fail(404, "Order not found");
	}

	const denied = assertBranchAccess(ids, existing.branchId);
	if (denied) return denied;

	const terminal = guardTerminalTransition(existing.status, "update");
	if (terminal) return terminal;

	const order = await orderRepo.setStatus(parsed.orderId, parsed.status);
	if (!order) {
		return fail(404, "Order not found");
	}

	if (parsed.status === "completed" && existing.customerId) {
		try {
			const profile = await orderRepo.findLoyaltyProfile(existing.customerId);
			if (profile) {
				const next =
					(profile.loyaltyPoints ?? 0) +
					earnedPointsForTotal(existing.totalAmount);
				await orderRepo.accrueLoyalty(
					existing.customerId,
					next,
					tierForPoints(next),
				);
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
	const [existing, ids] = await Promise.all([
		orderRepo.findStatus(parsed.orderId),
		getAccessibleBranchIds(user.id, user.role),
	]);

	if (!existing) {
		return fail(404, "Order not found");
	}

	const denied = assertBranchAccess(ids, existing.branchId);
	if (denied) return denied;

	const terminal = guardTerminalTransition(existing.status, "cancel");
	if (terminal) return terminal;

	const order = await orderRepo.setStatus(parsed.orderId, "cancelled");
	if (!order) {
		return fail(404, "Order not found");
	}

	void publishAbly("orders", "order-cancelled", { orderId: order.id });

	return ok(order);
};
