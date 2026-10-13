import { and, asc, count, desc, eq, gte, ilike, lt, or, sql, sum } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { CurrentUser } from "../../access/index.js";
import {
	assertBranchAccess,
	branchFilter,
	emptyScope,
	getAccessibleBranchIds,
} from "../../access/index.js";
import { db } from "../../db/index.js";
import { user as userTable } from "../../db/schema/auth-schema.js";
import { branches } from "../../db/schema/branches.js";
import { transactions } from "../../db/schema/finance.js";
import { dailySetorans } from "../../db/schema/orders.js";
import { fail, ok } from "../../lib/http.js";
import { pageResult, resolveTableParams } from "../../lib/schema.js";
import { containsPattern } from "../../lib/table.js";
import { logAudit } from "../../utils/effects.js";
import type { setoransQuery } from "./model.js";

export const getExpectedCash = async (
	user: CurrentUser,
	branchId: string,
	date: string,
) => {
	const ids = await getAccessibleBranchIds(user.id, user.role);
	const denied = assertBranchAccess(ids, branchId);
	if (denied) return denied;

	const startDate = new Date(`${date}T00:00:00.000Z`);
	const endDate = new Date(startDate);
	endDate.setUTCDate(endDate.getUTCDate() + 1);

	const rows = await db
		.select({
			paymentMethod: transactions.paymentMethod,
			total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
		})
		.from(transactions)
		.where(
			and(
				eq(transactions.branchId, branchId),
				gte(transactions.createdAt, startDate),
				lt(transactions.createdAt, endDate),
			),
		)
		.groupBy(transactions.paymentMethod);

	const result = { cash: 0, qris: 0, debit: 0, credit: 0 };
	for (const r of rows) {
		if (r.paymentMethod in result) {
			result[r.paymentMethod as keyof typeof result] = Number(r.total);
		}
	}

	return ok({
		cashTotal: result.cash,
		qrisTotal: result.qris,
		debitTotal: result.debit,
		creditTotal: result.credit,
		total: result.cash + result.qris + result.debit + result.credit,
	});
};

/**
 * Kolom yang boleh di-sort dari client (`sortBy` di luar ini diabaikan).
 */
const SETORAN_SORT_COLUMNS = {
	createdAt: dailySetorans.createdAt,
	date: dailySetorans.date,
	amount: dailySetorans.amount,
	status: dailySetorans.status,
} as const;

export const getSetorans = async (
	user: CurrentUser,
	params: typeof setoransQuery.static,
) => {
	const ids = await getAccessibleBranchIds(user.id, user.role);
	const { page, pageSize, sortDir } = resolveTableParams(params);
	const emptyPage = {
		...pageResult([], 0, page, pageSize),
		summary: { total: 0, totalAmount: "0", approved: 0, pending: 0 },
	};

	if (emptyScope(ids)) {
		return ok(emptyPage);
	}

	const conditions = [branchFilter(dailySetorans, params.branch ?? null, ids)];

	if (params.status) {
		conditions.push(eq(dailySetorans.status, params.status));
	}

	const cashierUser = alias(userTable, "cashier");
	const verifierUser = alias(userTable, "verifier");

	const q = params.q?.trim();
	if (q) {
		const pattern = containsPattern(q);
		const search = or(
			ilike(branches.name, pattern),
			ilike(cashierUser.name, pattern),
		);
		if (search) conditions.push(search);
	}

	const where = and(...conditions);
	const sortCol =
		params.sortBy && params.sortBy in SETORAN_SORT_COLUMNS
			? SETORAN_SORT_COLUMNS[
					params.sortBy as keyof typeof SETORAN_SORT_COLUMNS
				]
			: dailySetorans.createdAt;
	const orderBy = sortDir === "asc" ? asc(sortCol) : desc(sortCol);

	const columns = {
		id: dailySetorans.id,
		branchId: dailySetorans.branchId,
		cashierId: dailySetorans.cashierId,
		amount: dailySetorans.amount,
		date: dailySetorans.date,
		status: dailySetorans.status,
		verifiedBy: dailySetorans.verifiedBy,
		notes: dailySetorans.notes,
		createdAt: dailySetorans.createdAt,
		branchName: branches.name,
		cashierName: cashierUser.name,
		verifiedByName: verifierUser.name,
	};

	const [rows, [{ value: total }], statusGroups] = await Promise.all([
		db
			.select(columns)
			.from(dailySetorans)
			.leftJoin(branches, eq(dailySetorans.branchId, branches.id))
			.leftJoin(cashierUser, eq(dailySetorans.cashierId, cashierUser.id))
			.leftJoin(verifierUser, eq(dailySetorans.verifiedBy, verifierUser.id))
			.where(where)
			.orderBy(orderBy)
			.limit(pageSize)
			.offset(page * pageSize),
		db
			.select({ value: count() })
			.from(dailySetorans)
			.leftJoin(branches, eq(dailySetorans.branchId, branches.id))
			.leftJoin(cashierUser, eq(dailySetorans.cashierId, cashierUser.id))
			.where(where),
		db
			.select({
				status: dailySetorans.status,
				value: count(),
				amount: sum(dailySetorans.amount),
			})
			.from(dailySetorans)
			.leftJoin(branches, eq(dailySetorans.branchId, branches.id))
			.leftJoin(cashierUser, eq(dailySetorans.cashierId, cashierUser.id))
			.where(where)
			.groupBy(dailySetorans.status),
	]);

	let totalAmount = 0;
	let approved = 0;
	let pending = 0;
	for (const group of statusGroups) {
		totalAmount += Number(group.amount ?? 0);
		if (group.status === "approved") approved = group.value;
		else if (group.status === "pending") pending = group.value;
	}

	return ok({
		...pageResult(
			rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
			total,
			page,
			pageSize,
		),
		summary: {
			total,
			totalAmount: String(totalAmount),
			approved,
			pending,
		},
	});
};

export const createSetoran = async (
	user: CurrentUser,
	branchId: string,
	formData: { amount: number; date: string; notes?: string },
) => {
	const ids = await getAccessibleBranchIds(user.id, user.role);
	const denied = assertBranchAccess(ids, branchId);
	if (denied) return denied;

	const existing = await db
		.select()
		.from(dailySetorans)
		.where(
			and(
				eq(dailySetorans.branchId, branchId),
				eq(dailySetorans.date, formData.date),
			),
		)
		.limit(1);

	let setoran: typeof dailySetorans.$inferSelect;
	if (existing.length > 0) {
		const prev = existing[0];
		if (prev.status !== "pending") {
			return fail(
				400,
				`Cannot update setoran with status "${prev.status}". Only pending setoran can be edited.`,
			);
		}
		[setoran] = await db
			.update(dailySetorans)
			.set({
				amount: formData.amount.toString(),
				cashierId: user.id,
				notes: formData.notes || null,
			})
			.where(eq(dailySetorans.id, prev.id))
			.returning();
	} else {
		try {
			[setoran] = await db
				.insert(dailySetorans)
				.values({
					branchId,
					cashierId: user.id,
					amount: formData.amount.toString(),
					date: formData.date,
					notes: formData.notes || null,
				})
				.returning();
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			const isUnique =
				msg.toLowerCase().includes("unique") ||
				msg.toLowerCase().includes("duplicate") ||
				msg.includes("daily_setorans_branch_date_idx");
			if (!isUnique) throw err;
			const [retryExisting] = await db
				.select()
				.from(dailySetorans)
				.where(
					and(
						eq(dailySetorans.branchId, branchId),
						eq(dailySetorans.date, formData.date),
					),
				)
				.limit(1);
			if (!retryExisting) {
				return fail(409, "Duplicate setoran detected, please retry.");
			}
			if (retryExisting.status !== "pending") {
				return fail(
					400,
					`Cannot update setoran with status "${retryExisting.status}". Only pending setoran can be edited.`,
				);
			}
			[setoran] = await db
				.update(dailySetorans)
				.set({
					amount: formData.amount.toString(),
					cashierId: user.id,
					notes: formData.notes || null,
				})
				.where(eq(dailySetorans.id, retryExisting.id))
				.returning();
		}
	}

	void logAudit({
		actorId: user.id,
		action: "create",
		targetTable: "daily_setorans",
		targetId: setoran.id,
		branchId,
		metadata: { amount: formData.amount },
	});

	return ok(setoran);
};

export const deleteSetoran = async (user: CurrentUser, id: string) => {
	const [setoran] = await db
		.select()
		.from(dailySetorans)
		.where(eq(dailySetorans.id, id));
	if (!setoran) return fail(404, "Setoran not found");
	if (setoran.cashierId !== user.id) return fail(403, "Forbidden");
	if (setoran.status !== "pending")
		return fail(400, "Can only delete pending setoran");

	await db.delete(dailySetorans).where(eq(dailySetorans.id, id));

	void logAudit({
		actorId: user.id,
		action: "delete",
		targetTable: "daily_setorans",
		targetId: id,
		branchId: setoran.branchId,
	});

	return ok(null);
};

const setSetoranStatus = async (
	user: CurrentUser,
	id: string,
	decision: "approved" | "rejected",
	notes?: string,
) => {
	const ids = await getAccessibleBranchIds(user.id, user.role);

	const [existing] = await db
		.select({ branchId: dailySetorans.branchId, status: dailySetorans.status })
		.from(dailySetorans)
		.where(eq(dailySetorans.id, id));

	if (!existing) return fail(404, "Setoran not found");
	const denied = assertBranchAccess(ids, existing.branchId);
	if (denied) return denied;
	if (existing.status !== "pending") {
		return fail(
			400,
			`Cannot ${decision === "approved" ? "approve" : "reject"} setoran with status "${existing.status}". Only pending can be ${decision === "approved" ? "approved" : "rejected"}.`,
		);
	}

	const [setoran] = await db
		.update(dailySetorans)
		.set({
			status: decision,
			verifiedBy: user.id,
			...(notes ? { notes } : {}),
		})
		.where(and(eq(dailySetorans.id, id), eq(dailySetorans.status, "pending")))
		.returning();

	if (!setoran) return fail(404, "Setoran not found");

	void logAudit({
		actorId: user.id,
		action: decision === "approved" ? "approve" : "reject",
		targetTable: "daily_setorans",
		targetId: id,
		branchId: setoran.branchId,
		metadata: { result: decision, notes },
	});

	return ok(setoran);
};

export const approveSetoran = async (
	user: CurrentUser,
	id: string,
	notes?: string,
) => setSetoranStatus(user, id, "approved", notes);

export const rejectSetoran = async (
	user: CurrentUser,
	id: string,
	notes?: string,
) => setSetoranStatus(user, id, "rejected", notes);
