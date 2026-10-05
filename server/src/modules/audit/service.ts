import { and, desc, eq } from "drizzle-orm";
import type { CurrentUser } from "../../access/index.js";
import { branchFilter, getAccessibleBranchIds } from "../../access/index.js";
import { db } from "../../db/index.js";
import { user as userTable } from "../../db/schema/auth-schema.js";
import { branches } from "../../db/schema/branches.js";
import { auditLogs } from "../../db/schema/system.js";
import { ok } from "../../lib/http.js";

export const getAuditLogs = async (
	user: CurrentUser,
	params?: {
		branch?: string;
		action?: string;
		limit?: number;
		offset?: number;
	},
) => {
	const ids = await getAccessibleBranchIds(user.id, user.role);
	const conditions = [];
	if (params?.branch) conditions.push(eq(auditLogs.branchId, params.branch));
	else conditions.push(branchFilter(auditLogs, null, ids));
	if (params?.action) conditions.push(eq(auditLogs.action, params.action));
	const rows = await db
		.select({
			id: auditLogs.id,
			actorId: auditLogs.actorId,
			branchId: auditLogs.branchId,
			action: auditLogs.action,
			targetTable: auditLogs.targetTable,
			targetId: auditLogs.targetId,
			metadata: auditLogs.metadata,
			createdAt: auditLogs.createdAt,
			actorName: userTable.name,
			branchName: branches.name,
		})
		.from(auditLogs)
		.leftJoin(userTable, eq(auditLogs.actorId, userTable.id))
		.leftJoin(branches, eq(auditLogs.branchId, branches.id))
		.where(conditions.length > 0 ? and(...conditions) : undefined)
		.orderBy(desc(auditLogs.createdAt))
		.limit(params?.limit ?? 100)
		.offset(params?.offset ?? 0);
	return ok(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
};
