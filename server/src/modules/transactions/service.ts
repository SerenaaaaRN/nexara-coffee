import { eq, inArray, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import type { CurrentUser } from "../../access/index.js";
import { ok, fail } from "../../lib/http.js";
import { branches } from "../../db/schema/branches.js";
import { transactions } from "../../db/schema/finance.js";
import { orders } from "../../db/schema/orders.js";

import { getAccessibleBranchIds } from "../../access/index.js";

export const getTransactions = async (user: CurrentUser) => {
	const ids = await getAccessibleBranchIds(user.id, user.role);
	const condition = ids
		? ids.length > 0
			? inArray(transactions.branchId, ids)
			: sql`1=0`
		: undefined;
	const rows = await db
		.select({
			id: transactions.id,
			orderId: transactions.orderId,
			branchId: transactions.branchId,
			paymentMethod: transactions.paymentMethod,
			amount: transactions.amount,
			status: transactions.status,
			createdAt: transactions.createdAt,
			orderNumber: orders.orderNumber,
			branchName: branches.name,
		})
		.from(transactions)
		.leftJoin(orders, eq(transactions.orderId, orders.id))
		.leftJoin(branches, eq(transactions.branchId, branches.id))
		.where(condition)
		.orderBy(transactions.createdAt);
	return ok(rows);
};

export const getTransactionDetail = async (
	user: CurrentUser,
	id: string,
) => {
	const [row] = await db
		.select()
		.from(transactions)
		.where(eq(transactions.id, id))
		.limit(1);
	if (!row)
		return fail(404, "Transaction not found",);
	const ids = await getAccessibleBranchIds(user.id, user.role);
	if (ids !== null && !ids.includes(row.branchId))
		return fail(403, "Forbidden");
	const [detail] = await db
		.select({
			id: transactions.id,
			orderId: transactions.orderId,
			branchId: transactions.branchId,
			paymentMethod: transactions.paymentMethod,
			amount: transactions.amount,
			status: transactions.status,
			createdAt: transactions.createdAt,
			orderNumber: orders.orderNumber,
			branchName: branches.name,
		})
		.from(transactions)
		.leftJoin(orders, eq(transactions.orderId, orders.id))
		.leftJoin(branches, eq(transactions.branchId, branches.id))
		.where(eq(transactions.id, id))
		.limit(1);
	return ok(detail ?? row);
};

export const recordTransaction = async (
	user: CurrentUser,
	data: {
		orderId: string;
		branchId: string;
		paymentMethod: string;
		amount: number;
	},
) => {
	const ids = await getAccessibleBranchIds(user.id, user.role);
	if (ids !== null && !ids.includes(data.branchId))
		return fail(403, "Forbidden");
	const [row] = await db
		.insert(transactions)
		.values({
			orderId: data.orderId,
			branchId: data.branchId,
			paymentMethod: data.paymentMethod,
			amount: String(data.amount),
			status: "completed",
		} as never)
		.returning();
	return ok(row);
};

export const refundTransaction = async (
	user: CurrentUser,
	transactionId: string,
) => {
	const [existing] = await db
		.select()
		.from(transactions)
		.where(eq(transactions.id, transactionId))
		.limit(1);
	if (!existing)
		return fail(404, "Transaction not found",);
	const ids = await getAccessibleBranchIds(user.id, user.role);
	if (ids !== null && !ids.includes(existing.branchId))
		return fail(403, "Forbidden");
	const [row] = await db
		.update(transactions)
		.set({ status: "refunded" } as never)
		.where(eq(transactions.id, transactionId))
		.returning();
	return ok(row);
};
