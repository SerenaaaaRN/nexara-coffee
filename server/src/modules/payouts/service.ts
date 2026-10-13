import { and, asc, count, desc, eq, ilike, inArray, or, sql, sum } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { CurrentUser } from "../../access/index.js";
import { emptyScope, getAccessibleBranchIds } from "../../access/index.js";
import { db } from "../../db/index.js";
import { user as userTable } from "../../db/schema/auth-schema.js";
import { branches } from "../../db/schema/branches.js";
import { payouts } from "../../db/schema/finance.js";
import { fail, ok } from "../../lib/http.js";
import { pageResult, resolveTableParams } from "../../lib/schema.js";
import { containsPattern } from "../../lib/table.js";
import type { payoutsQuery } from "./model.js";

/**
 * Kolom yang boleh di-sort dari client (`sortBy` di luar ini diabaikan).
 */
const PAYOUT_SORT_COLUMNS = {
	createdAt: payouts.createdAt,
	amount: payouts.amount,
	status: payouts.status,
} as const;

export const getPayouts = async (
	user: CurrentUser,
	params: typeof payoutsQuery.static,
) => {
	const ids = await getAccessibleBranchIds(user.id, user.role);
	const { page, pageSize, sortDir } = resolveTableParams(params);
	const emptyPage = {
		...pageResult([], 0, page, pageSize),
		summary: {
			total: 0,
			totalAmount: "0",
			approvedAmount: "0",
			pendingCount: 0,
		},
	};

	if (emptyScope(ids)) {
		return ok(emptyPage);
	}

	const franchiseOwner = alias(userTable, "franchise_owner");
	const approvedByUser = alias(userTable, "approved_by");
	const conditions = [];
	if (params.branchId) {
		if (ids !== null && !ids.includes(params.branchId)) {
			return ok(emptyPage);
		}
		conditions.push(eq(payouts.branchId, params.branchId));
	}
	if (params.status) conditions.push(eq(payouts.status, params.status));
	if (ids !== null)
		conditions.push(ids.length > 0 ? inArray(payouts.branchId, ids) : sql`1=0`);

	const q = params.q?.trim();
	if (q) {
		const pattern = containsPattern(q);
		conditions.push(
			or(
				ilike(branches.name, pattern),
				ilike(franchiseOwner.name, pattern),
			),
		);
	}

	const where = conditions.length > 0 ? and(...conditions) : undefined;
	const sortCol =
		params.sortBy && params.sortBy in PAYOUT_SORT_COLUMNS
			? PAYOUT_SORT_COLUMNS[params.sortBy as keyof typeof PAYOUT_SORT_COLUMNS]
			: payouts.createdAt;
	const orderBy = sortDir === "asc" ? asc(sortCol) : desc(sortCol);

	const columns = {
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
	};

	const [rows, [{ value: total }], statusGroups] = await Promise.all([
		db
			.select(columns)
			.from(payouts)
			.leftJoin(franchiseOwner, eq(payouts.franchiseOwnerId, franchiseOwner.id))
			.leftJoin(branches, eq(payouts.branchId, branches.id))
			.leftJoin(approvedByUser, eq(payouts.approvedBy, approvedByUser.id))
			.where(where)
			.orderBy(orderBy)
			.limit(pageSize)
			.offset(page * pageSize),
		db
			.select({ value: count() })
			.from(payouts)
			.leftJoin(franchiseOwner, eq(payouts.franchiseOwnerId, franchiseOwner.id))
			.leftJoin(branches, eq(payouts.branchId, branches.id))
			.where(where),
		db
			.select({
				status: payouts.status,
				value: count(),
				amount: sum(payouts.amount),
			})
			.from(payouts)
			.leftJoin(franchiseOwner, eq(payouts.franchiseOwnerId, franchiseOwner.id))
			.leftJoin(branches, eq(payouts.branchId, branches.id))
			.where(where)
			.groupBy(payouts.status),
	]);

	let totalAmount = 0;
	let approvedAmount = 0;
	let pendingCount = 0;
	for (const group of statusGroups) {
		totalAmount += Number(group.amount ?? 0);
		if (group.status === "approved")
			approvedAmount = Number(group.amount ?? 0);
		else if (group.status === "pending") pendingCount = group.value;
	}

	return ok({
		...pageResult(
			rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
			total,
			page,
			pageSize,
		),
		summary: { total, totalAmount: String(totalAmount), approvedAmount: String(approvedAmount), pendingCount },
	});
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
