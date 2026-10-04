import { and, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { status } from "elysia";
import { db } from "../../db/index.js";
import { user as userTable } from "../../db/schema/auth-schema.js";
import { branches } from "../../db/schema/branches.js";
import { transactions } from "../../db/schema/finance.js";
import { dailySetorans } from "../../db/schema/orders.js";
import { logAudit } from "../../lib/audit-log.js";
import { can, type Role } from "../../lib/rbac.js";
import { getAccessibleBranchIds } from "../../utils/branch-scope.js";

export const getExpectedCash = async (
	user: { id: string; role: string },
	branchId: string,
	date: string,
) => {
	if (!can(user.role as Role, "read", "finance")) {
		return status(403, { success: false as const, error: "Forbidden" });
	}
	const ids = await getAccessibleBranchIds(user.id, user.role);
	if (ids !== null && !ids.includes(branchId)) {
		return status(403, { success: false as const, error: "Forbidden" });
	}

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

	return {
		success: true as const,
		data: {
			cashTotal: result.cash,
			qrisTotal: result.qris,
			debitTotal: result.debit,
			creditTotal: result.credit,
			total: result.cash + result.qris + result.debit + result.credit,
		},
	};
};

export const getSetorans = async (
	user: { id: string; role: string },
	branch?: string | null,
	limit?: number,
) => {
	if (!can(user.role as Role, "read", "setoran")) {
		return status(403, { success: false as const, error: "Forbidden" });
	}
	const ids = await getAccessibleBranchIds(user.id, user.role);
	const branchId = branch ?? null;
	const take = limit ?? 300;

	const conditions = branchId
		? eq(dailySetorans.branchId, branchId)
		: ids
			? ids.length > 0
				? inArray(dailySetorans.branchId, ids)
				: sql`1=0`
			: undefined;

	const cashierUser = alias(userTable, "cashier");
	const verifierUser = alias(userTable, "verifier");

	const rows = await db
		.select({
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
		})
		.from(dailySetorans)
		.leftJoin(branches, eq(dailySetorans.branchId, branches.id))
		.leftJoin(cashierUser, eq(dailySetorans.cashierId, cashierUser.id))
		.leftJoin(verifierUser, eq(dailySetorans.verifiedBy, verifierUser.id))
		.where(conditions)
		.orderBy(desc(dailySetorans.createdAt))
		.limit(take);

	return { success: true as const, data: rows };
};

export const createSetoran = async (
	user: { id: string; role: string },
	branchId: string,
	formData: { amount: number; date: string; notes?: string },
) => {
	if (!can(user.role as Role, "create", "setoran")) {
		return status(403, { success: false as const, error: "Forbidden" });
	}
	const ids = await getAccessibleBranchIds(user.id, user.role);
	if (ids !== null && !ids.includes(branchId)) {
		return status(403, {
			success: false as const,
			error: "Forbidden branch access",
		});
	}

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
			return status(400, {
				success: false as const,
				error: `Cannot update setoran with status "${prev.status}". Only pending setoran can be edited.`,
			});
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
				return status(409, {
					success: false as const,
					error: "Duplicate setoran detected, please retry.",
				});
			}
			if (retryExisting.status !== "pending") {
				return status(400, {
					success: false as const,
					error: `Cannot update setoran with status "${retryExisting.status}". Only pending setoran can be edited.`,
				});
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

	return { success: true as const, data: setoran };
};

export const deleteSetoran = async (
	user: { id: string; role: string },
	id: string,
) => {
	if (!can(user.role as Role, "delete", "setoran")) {
		return status(403, { success: false as const, error: "Forbidden" });
	}

	const [setoran] = await db
		.select()
		.from(dailySetorans)
		.where(eq(dailySetorans.id, id));
	if (!setoran)
		return status(404, { success: false as const, error: "Not found" });
	if (setoran.cashierId !== user.id)
		return status(403, { success: false as const, error: "Forbidden" });
	if (setoran.status !== "pending")
		return status(400, {
			success: false as const,
			error: "Can only delete pending setoran",
		});

	await db.delete(dailySetorans).where(eq(dailySetorans.id, id));

	void logAudit({
		actorId: user.id,
		action: "delete",
		targetTable: "daily_setorans",
		targetId: id,
		branchId: setoran.branchId,
	});

	return { success: true as const, data: null };
};

export const approveSetoran = async (
	user: { id: string; role: string },
	id: string,
	notes?: string,
) => {
	if (!can(user.role as Role, "approve", "setoran")) {
		return status(403, { success: false as const, error: "Forbidden" });
	}
	const ids = await getAccessibleBranchIds(user.id, user.role);

	const [existing] = await db
		.select({ branchId: dailySetorans.branchId, status: dailySetorans.status })
		.from(dailySetorans)
		.where(eq(dailySetorans.id, id));

	if (!existing)
		return status(404, { success: false as const, error: "Not found" });
	if (ids !== null && !ids.includes(existing.branchId)) {
		return status(403, { success: false as const, error: "Forbidden" });
	}
	if (existing.status !== "pending") {
		return status(400, {
			success: false as const,
			error: `Cannot approve setoran with status "${existing.status}". Only pending can be approved.`,
		});
	}

	const [setoran] = await db
		.update(dailySetorans)
		.set({
			status: "approved",
			verifiedBy: user.id,
			...(notes ? { notes } : {}),
		})
		.where(and(eq(dailySetorans.id, id), eq(dailySetorans.status, "pending")))
		.returning();

	if (!setoran)
		return status(404, { success: false as const, error: "Not found" });

	void logAudit({
		actorId: user.id,
		action: "approve",
		targetTable: "daily_setorans",
		targetId: id,
		branchId: setoran.branchId,
		metadata: { result: "approved", notes },
	});

	return { success: true as const, data: setoran };
};

export const rejectSetoran = async (
	user: { id: string; role: string },
	id: string,
	notes?: string,
) => {
	if (!can(user.role as Role, "approve", "setoran")) {
		return status(403, { success: false as const, error: "Forbidden" });
	}
	const ids = await getAccessibleBranchIds(user.id, user.role);

	const [existing] = await db
		.select({ branchId: dailySetorans.branchId, status: dailySetorans.status })
		.from(dailySetorans)
		.where(eq(dailySetorans.id, id));

	if (!existing)
		return status(404, { success: false as const, error: "Not found" });
	if (ids !== null && !ids.includes(existing.branchId)) {
		return status(403, { success: false as const, error: "Forbidden" });
	}
	if (existing.status !== "pending") {
		return status(400, {
			success: false as const,
			error: `Cannot reject setoran with status "${existing.status}". Only pending can be rejected.`,
		});
	}

	const [setoran] = await db
		.update(dailySetorans)
		.set({
			status: "rejected",
			verifiedBy: user.id,
			...(notes ? { notes } : {}),
		})
		.where(and(eq(dailySetorans.id, id), eq(dailySetorans.status, "pending")))
		.returning();

	if (!setoran)
		return status(404, { success: false as const, error: "Not found" });

	void logAudit({
		actorId: user.id,
		action: "reject",
		targetTable: "daily_setorans",
		targetId: id,
		branchId: setoran.branchId,
		metadata: { result: "rejected", notes },
	});

	return { success: true as const, data: setoran };
};
