import type { CurrentUser } from "../../access/index.js";
import {
	assertBranchAccess,
	emptyScope,
	getAccessibleBranchIds,
} from "../../access/index.js";
import { fail, ok } from "../../lib/http.js";
import { pageResult, resolveTableParams } from "../../lib/schema.js";
import type { payoutsQuery, requestPayoutBody } from "./model.js";
import { payoutRepo, type NewPayout } from "./repository.js";

const emptySummary = {
	total: 0,
	totalAmount: "0",
	approvedAmount: "0",
	pendingCount: 0,
};

const toAmountSummary = (
	groups: { status: string; value: number; amount: string | null }[],
) => {
	const summary = { totalAmount: "0", approvedAmount: "0", pendingCount: 0 };
	for (const group of groups) {
		summary.totalAmount = String(
			Number(summary.totalAmount) + Number(group.amount ?? 0),
		);
		if (group.status === "approved")
			summary.approvedAmount = String(Number(group.amount ?? 0));
		else if (group.status === "pending") summary.pendingCount = group.value;
	}
	return summary;
};

export const getPayouts = async (
	user: CurrentUser,
	params: typeof payoutsQuery.static,
) => {
	const ids = await getAccessibleBranchIds(user.id, user.role);
	const { page, pageSize, sortDir } = resolveTableParams(params);

	if (emptyScope(ids)) {
		return ok({ ...pageResult([], 0, page, pageSize), summary: emptySummary });
	}

	const result = await payoutRepo.list({
		ids,
		branchId: params.branchId,
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

export const requestPayout = async (
	user: CurrentUser,
	data: typeof requestPayoutBody.static,
) => {
	const ids = await getAccessibleBranchIds(user.id, user.role);
	const denied = assertBranchAccess(ids, data.branchId);
	if (denied) return denied;

	const payload: NewPayout = {
		franchiseOwnerId: user.id,
		branchId: data.branchId,
		amount: String(data.amount),
		periodStart: data.periodStart,
		periodEnd: data.periodEnd,
	};
	const payout = await payoutRepo.create(payload);
	if (!payout) return fail(500, "Failed to request payout");

	return ok(payout);
};

export const approvePayout = async (user: CurrentUser, payoutId: string) => {
	const payout = await payoutRepo.approve(payoutId, user.id);
	if (!payout) return fail(404, "Payout not found");

	return ok(payout);
};
