import type { CurrentUser } from "../../access/index.js";
import { emptyScope, getAccessibleBranchIds } from "../../access/index.js";
import { fail, ok } from "../../lib/http.js";
import { pageResult, resolveTableParams } from "../../lib/schema.js";
import type { getTransactionsQuery, recordTransactionBody } from "./model.js";
import { transactionRepo, type NewTransaction } from "./repository.js";

const emptySummary = {
	total: 0,
	totalAmount: "0",
	completedAmount: "0",
	refundedCount: 0,
};

const toAmountSummary = (
	groups: { status: string; value: number; amount: string | null }[],
) => {
	const summary = {
		totalAmount: "0",
		completedAmount: "0",
		refundedCount: 0,
	};
	for (const group of groups) {
		summary.totalAmount = String(
			Number(summary.totalAmount) + Number(group.amount ?? 0),
		);
		if (group.status === "completed")
			summary.completedAmount = String(Number(group.amount ?? 0));
		else if (group.status === "refunded") summary.refundedCount = group.value;
	}
	return summary;
};

export const getTransactions = async (
	user: CurrentUser,
	params: typeof getTransactionsQuery.static,
) => {
	const ids = await getAccessibleBranchIds(user.id, user.role);
	const { page, pageSize, sortDir } = resolveTableParams(params);

	if (emptyScope(ids)) {
		return ok({ ...pageResult([], 0, page, pageSize), summary: emptySummary });
	}

	const result = await transactionRepo.list({
		ids,
		branchId: params.branchId,
		paymentMethod: params.paymentMethod,
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
		summary: { total: result.total, ...toAmountSummary(result.statusGroups) },
	});
};

export const getTransactionDetail = async (user: CurrentUser, id: string) => {
	const row = await transactionRepo.findById(id);
	if (!row) return fail(404, "Transaction not found");

	const ids = await getAccessibleBranchIds(user.id, user.role);
	if (ids !== null && !ids.includes(row.branchId))
		return fail(403, "Forbidden");

	const detail = await transactionRepo.findDetail(id);

	return ok(detail ?? row);
};

export const recordTransaction = async (
	user: CurrentUser,
	data: typeof recordTransactionBody.static,
) => {
	const ids = await getAccessibleBranchIds(user.id, user.role);
	if (ids !== null && !ids.includes(data.branchId))
		return fail(403, "Forbidden");

	const payload: NewTransaction = {
		orderId: data.orderId,
		branchId: data.branchId,
		paymentMethod: data.paymentMethod,
		amount: String(data.amount),
		status: "completed",
	};
	const row = await transactionRepo.create(payload);
	if (!row) return fail(500, "Failed to record transaction");

	return ok(row);
};

export const refundTransaction = async (
	user: CurrentUser,
	transactionId: string,
) => {
	const existing = await transactionRepo.findById(transactionId);
	if (!existing) return fail(404, "Transaction not found");

	const ids = await getAccessibleBranchIds(user.id, user.role);
	if (ids !== null && !ids.includes(existing.branchId))
		return fail(403, "Forbidden");

	const row = await transactionRepo.setStatus(transactionId, "refunded");
	if (!row) return fail(404, "Transaction not found");

	return ok(row);
};
