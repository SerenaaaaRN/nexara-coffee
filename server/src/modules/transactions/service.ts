import { eq, inArray, sql } from "drizzle-orm";
import { status } from "elysia";
import { db } from "../../db/index.js";
import { branches } from "../../db/schema/branches.js";
import { transactions } from "../../db/schema/finance.js";
import { orders } from "../../db/schema/orders.js";
import { can, type Role } from "../../lib/rbac.js";
import { getAccessibleBranchIds } from "../../utils/branch-scope.js";

export const getTransactions = async (user: { id: string; role: string }) => {
	if (!can(user.role as Role, "read", "finance"))
		return status(403, { success: false as const, error: "Forbidden" });
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
	return { success: true as const, data: rows };
};

export const getTransactionDetail = async (
	user: { id: string; role: string },
	id: string,
) => {
	if (!can(user.role as Role, "read", "finance"))
		return status(403, { success: false as const, error: "Forbidden" });
	const [row] = await db
		.select()
		.from(transactions)
		.where(eq(transactions.id, id))
		.limit(1);
	if (!row)
		return status(404, {
			success: false as const,
			error: "Transaction not found",
		});
	const ids = await getAccessibleBranchIds(user.id, user.role);
	if (ids !== null && !ids.includes(row.branchId))
		return status(403, { success: false as const, error: "Forbidden" });
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
	return { success: true as const, data: detail ?? row };
};

export const recordTransaction = async (
	user: { id: string; role: string },
	data: {
		orderId: string;
		branchId: string;
		paymentMethod: string;
		amount: number;
	},
) => {
	if (!can(user.role as Role, "create", "finance"))
		return status(403, { success: false as const, error: "Forbidden" });
	const ids = await getAccessibleBranchIds(user.id, user.role);
	if (ids !== null && !ids.includes(data.branchId))
		return status(403, { success: false as const, error: "Forbidden" });
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
	return { success: true as const, data: row };
};

export const refundTransaction = async (
	user: { id: string; role: string },
	transactionId: string,
) => {
	if (!can(user.role as Role, "update", "finance"))
		return status(403, { success: false as const, error: "Forbidden" });
	const [existing] = await db
		.select()
		.from(transactions)
		.where(eq(transactions.id, transactionId))
		.limit(1);
	if (!existing)
		return status(404, {
			success: false as const,
			error: "Transaction not found",
		});
	const ids = await getAccessibleBranchIds(user.id, user.role);
	if (ids !== null && !ids.includes(existing.branchId))
		return status(403, { success: false as const, error: "Forbidden" });
	const [row] = await db
		.update(transactions)
		.set({ status: "refunded" } as never)
		.where(eq(transactions.id, transactionId))
		.returning();
	return { success: true as const, data: row };
};
