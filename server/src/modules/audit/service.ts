import type { CurrentUser } from "../../access/index.js";
import { emptyScope, getAccessibleBranchIds } from "../../access/index.js";
import { ok } from "../../lib/http.js";
import { pageResult, resolveTableParams } from "../../lib/schema.js";
import type { auditQuery } from "./model.js";
import { auditRepo } from "./repository.js";

export const getAuditLogs = async (
	user: CurrentUser,
	params?: typeof auditQuery.static,
) => {
	const ids = await getAccessibleBranchIds(user.id, user.role);
	const { page, pageSize } = resolveTableParams(params);
	if (emptyScope(ids)) {
		return ok(pageResult([], 0, page, pageSize));
	}

	const result = await auditRepo.list({
		ids,
		branch: params?.branch,
		action: params?.action,
		targetTable: params?.targetTable,
		q: params?.q,
		page,
		pageSize,
	});

	return ok(
		pageResult(
			result.rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
			result.total,
			page,
			pageSize,
		),
	);
};

export const getAuditTables = async (user: CurrentUser) => {
	const ids = await getAccessibleBranchIds(user.id, user.role);
	if (emptyScope(ids)) {
		return ok({ tables: [], total: 0 });
	}

	return ok(await auditRepo.tables(ids));
};
