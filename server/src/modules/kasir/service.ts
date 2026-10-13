import type { CurrentUser } from "../../access/index.js";
import {
	assertBranchAccess,
	emptyScope,
	getAccessibleBranchIds,
} from "../../access/index.js";
import { fail, ok } from "../../lib/http.js";
import { pageResult, resolveTableParams } from "../../lib/schema.js";
import { logAudit } from "../../utils/effects.js";
import type { setoransQuery } from "./model.js";
import { kasirRepo } from "./repository.js";

const emptySummary = { total: 0, totalAmount: "0", approved: 0, pending: 0 };

const toAmountSummary = (
	groups: { status: string; value: number; amount: string | null }[],
) => {
	const summary = { totalAmount: "0", approved: 0, pending: 0 };
	for (const group of groups) {
		summary.totalAmount = String(
			Number(summary.totalAmount) + Number(group.amount ?? 0),
		);
		if (group.status === "approved") summary.approved = group.value;
		else if (group.status === "pending") summary.pending = group.value;
	}
	return summary;
};

const toDailyTotals = (rows: { paymentMethod: string; total: string }[]) => {
	const result = { cash: 0, qris: 0, debit: 0, credit: 0 };
	for (const r of rows) {
		if (r.paymentMethod in result) {
			result[r.paymentMethod as keyof typeof result] = Number(r.total);
		}
	}
	return {
		cashTotal: result.cash,
		qrisTotal: result.qris,
		debitTotal: result.debit,
		creditTotal: result.credit,
		total: result.cash + result.qris + result.debit + result.credit,
	};
};

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

	const rows = await kasirRepo.dailyTotals(branchId, startDate, endDate);

	return ok(toDailyTotals(rows));
};

export const getSetorans = async (
	user: CurrentUser,
	params: typeof setoransQuery.static,
) => {
	const ids = await getAccessibleBranchIds(user.id, user.role);
	const { page, pageSize, sortDir } = resolveTableParams(params);

	if (emptyScope(ids)) {
		return ok({ ...pageResult([], 0, page, pageSize), summary: emptySummary });
	}

	const result = await kasirRepo.list({
		ids,
		branch: params.branch,
		status: params.status,
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
		summary: { total: result.total, ...toAmountSummary(result.statusGroups) },
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

	const existing = await kasirRepo.findByBranchDate(branchId, formData.date);

	let setoran;
	if (existing.length > 0) {
		const prev = existing[0];
		if (prev.status !== "pending") {
			return fail(
				400,
				`Cannot update setoran with status "${prev.status}". Only pending setoran can be edited.`,
			);
		}
		setoran = await kasirRepo.updateAmount(prev.id, {
			amount: formData.amount.toString(),
			cashierId: user.id,
			notes: formData.notes || null,
		});
		if (!setoran) return fail(500, "Failed to update setoran");
	} else {
		try {
			setoran = await kasirRepo.create({
				branchId,
				cashierId: user.id,
				amount: formData.amount.toString(),
				date: formData.date,
				notes: formData.notes || null,
			});
			if (!setoran) return fail(500, "Failed to create setoran");
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			const isUnique =
				msg.toLowerCase().includes("unique") ||
				msg.toLowerCase().includes("duplicate") ||
				msg.includes("daily_setorans_branch_date_idx");
			if (!isUnique) throw err;
			const retryExisting = await kasirRepo.findByBranchDate(
				branchId,
				formData.date,
			);
			if (retryExisting.length === 0) {
				return fail(409, "Duplicate setoran detected, please retry.");
			}
			const retry = retryExisting[0];
			if (retry.status !== "pending") {
				return fail(
					400,
					`Cannot update setoran with status "${retry.status}". Only pending setoran can be edited.`,
				);
			}
			setoran = await kasirRepo.updateAmount(retry.id, {
				amount: formData.amount.toString(),
				cashierId: user.id,
				notes: formData.notes || null,
			});
			if (!setoran) return fail(500, "Failed to update setoran");
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
	const setoran = await kasirRepo.findById(id);
	if (!setoran) return fail(404, "Setoran not found");
	if (setoran.cashierId !== user.id) return fail(403, "Forbidden");
	if (setoran.status !== "pending")
		return fail(400, "Can only delete pending setoran");

	await kasirRepo.remove(id);

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

	const existing = await kasirRepo.findStatus(id);
	if (!existing) return fail(404, "Setoran not found");

	const denied = assertBranchAccess(ids, existing.branchId);
	if (denied) return denied;

	if (existing.status !== "pending") {
		return fail(
			400,
			`Cannot ${decision === "approved" ? "approve" : "reject"} setoran with status "${existing.status}". Only pending can be ${decision === "approved" ? "approved" : "rejected"}.`,
		);
	}

	const setoran = await kasirRepo.setDecision(id, {
		status: decision,
		verifiedBy: user.id,
		...(notes ? { notes } : {}),
	});
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
