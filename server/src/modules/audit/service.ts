import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import type { CurrentUser } from "../../access/index.js";
import {
	branchFilter,
	emptyScope,
	getAccessibleBranchIds,
} from "../../access/index.js";
import { db } from "../../db/index.js";
import { user as userTable } from "../../db/schema/auth-schema.js";
import { branches } from "../../db/schema/branches.js";
import { auditLogs } from "../../db/schema/system.js";
import { ok } from "../../lib/http.js";
import { pageResult, resolveTableParams } from "../../lib/schema.js";
import { containsPattern } from "../../lib/table.js";
import type { auditQuery } from "./model.js";

export const getAuditLogs = async (
	user: CurrentUser,
	params?: typeof auditQuery.static,
) => {
	const ids = await getAccessibleBranchIds(user.id, user.role);
	const { page, pageSize } = resolveTableParams(params);
	if (emptyScope(ids)) {
		return ok(pageResult([], 0, page, pageSize));
	}

	const conditions = [];
	if (params?.branch) conditions.push(eq(auditLogs.branchId, params.branch));
	else conditions.push(branchFilter(auditLogs, null, ids));
	if (params?.action) conditions.push(eq(auditLogs.action, params.action));
	if (params?.targetTable)
		conditions.push(eq(auditLogs.targetTable, params.targetTable));

	const q = params?.q?.trim();
	if (q) {
		const pattern = containsPattern(q);
		conditions.push(
			or(
				ilike(userTable.name, pattern),
				ilike(branches.name, pattern),
				ilike(auditLogs.targetTable, pattern),
				ilike(auditLogs.action, pattern),
			),
		);
	}

	const where = conditions.length > 0 ? and(...conditions) : undefined;
	const columns = {
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
	};

	const [rows, [{ value: total }]] = await Promise.all([
		db
			.select(columns)
			.from(auditLogs)
			.leftJoin(userTable, eq(auditLogs.actorId, userTable.id))
			.leftJoin(branches, eq(auditLogs.branchId, branches.id))
			.where(where)
			.orderBy(desc(auditLogs.createdAt))
			.limit(pageSize)
			.offset(page * pageSize),
		db
			.select({ value: count() })
			.from(auditLogs)
			.leftJoin(userTable, eq(auditLogs.actorId, userTable.id))
			.leftJoin(branches, eq(auditLogs.branchId, branches.id))
			.where(where),
	]);
	return ok(
		pageResult(
			rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
			total,
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
	const scope = branchFilter(auditLogs, null, ids);
	const [tableRows, [{ value: total }]] = await Promise.all([
		db
			.selectDistinct({ targetTable: auditLogs.targetTable })
			.from(auditLogs)
			.where(scope)
			.orderBy(auditLogs.targetTable),
		db.select({ value: count() }).from(auditLogs).where(scope),
	]);
	return ok({
		tables: tableRows.map((r) => r.targetTable),
		total,
	});
};
