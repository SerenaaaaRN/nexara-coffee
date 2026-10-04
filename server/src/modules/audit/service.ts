import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { status } from "elysia";
import { db } from "../../db/index.js";
import { user as userTable } from "../../db/schema/auth-schema.js";
import { branches } from "../../db/schema/branches.js";
import { auditLogs } from "../../db/schema/system.js";
import { can, type Role } from "../../lib/rbac.js";
import { getAccessibleBranchIds } from "../../utils/branch-scope.js";

export const getAuditLogs = async (
	user: { id: string; role: string },
	params?: { branch?: string; action?: string; limit?: number },
) => {
	if (!can(user.role as Role, "read", "system"))
		return status(403, { success: false as const, error: "Forbidden" });
	const ids = await getAccessibleBranchIds(user.id, user.role);
	const conditions = [];
	if (params?.branch) conditions.push(eq(auditLogs.branchId, params.branch));
	else if (ids !== null)
		conditions.push(
			ids.length > 0 ? inArray(auditLogs.branchId, ids) : sql`1=0`,
		);
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
		.limit(params?.limit ?? 100);
	return { success: true as const, data: rows };
};
