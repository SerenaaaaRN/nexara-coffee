import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { CurrentUser } from "../../access/index.js";
import { getAccessibleBranchIds } from "../../access/index.js";
import { db } from "../../db/index.js";
import { user as userTable } from "../../db/schema/auth-schema.js";
import { branches } from "../../db/schema/branches.js";
import { payouts } from "../../db/schema/finance.js";
import { fail, ok } from "../../lib/http.js";

export const getPayouts = async (
	user: CurrentUser,
	params?: { branchId?: string; status?: string },
) => {
	const ids = await getAccessibleBranchIds(user.id, user.role);
	const franchiseOwner = alias(userTable, "franchise_owner");
	const approvedByUser = alias(userTable, "approved_by");
	const conditions = [];
	if (params?.branchId) conditions.push(eq(payouts.branchId, params.branchId));
	if (params?.status) conditions.push(eq(payouts.status, params.status));
	if (ids !== null)
		conditions.push(ids.length > 0 ? inArray(payouts.branchId, ids) : sql`1=0`);
	const rows = await db
		.select({
			id: payouts.id,
			franchiseOwnerId: payouts.franchiseOwnerId,
			branchId: payouts.branchId,
			amount: payouts.amount,
			periodStart: payouts.periodStart,
			periodEnd: payouts.periodEnd,
			status: payouts.status,
			approvedBy: payouts.approvedBy,
			createdAt: payouts.createdAt,
			franchiseOwnerName: franchiseOwner.name,
			branchName: branches.name,
			approvedByName: approvedByUser.name,
		})
		.from(payouts)
		.leftJoin(franchiseOwner, eq(payouts.franchiseOwnerId, franchiseOwner.id))
		.leftJoin(branches, eq(payouts.branchId, branches.id))
		.leftJoin(approvedByUser, eq(payouts.approvedBy, approvedByUser.id))
		.where(conditions.length > 0 ? and(...conditions) : undefined)
		.orderBy(desc(payouts.createdAt));
	return ok(rows);
};

export const requestPayout = async (
	user: CurrentUser,
	data: {
		branchId: string;
		amount: number;
		periodStart: string;
		periodEnd: string;
	},
) => {
	const [payout] = await db
		.insert(payouts)
		.values({
			franchiseOwnerId: user.id,
			branchId: data.branchId,
			amount: String(data.amount),
			periodStart: data.periodStart,
			periodEnd: data.periodEnd,
		} as never)
		.returning();
	return ok(payout);
};

export const approvePayout = async (user: CurrentUser, payoutId: string) => {
	const [payout] = await db
		.update(payouts)
		.set({ status: "approved", approvedBy: user.id } as never)
		.where(eq(payouts.id, payoutId))
		.returning();
	if (!payout) return fail(404, "Payout not found");
	return ok(payout);
};
