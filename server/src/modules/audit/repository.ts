import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { branchFilter } from "../../access/index.js";
import { db } from "../../db/index.js";
import { user as userTable } from "../../db/schema/auth-schema.js";
import { branches } from "../../db/schema/branches.js";
import { auditLogs } from "../../db/schema/system.js";
import { containsPattern } from "../../lib/table.js";

export type AuditListArgs = {
	ids: string[] | null;
	branch?: string;
	action?: string;
	targetTable?: string;
	q?: string;
	page: number;
	pageSize: number;
};

export const auditRepo = {
	list: async (args: AuditListArgs) => {
		const branch = args.branch
			? eq(auditLogs.branchId, args.branch)
			: branchFilter(auditLogs, null, args.ids);
		const action = args.action ? eq(auditLogs.action, args.action) : undefined;
		const target = args.targetTable
			? eq(auditLogs.targetTable, args.targetTable)
			: undefined;

		const term = args.q?.trim();
		const search = term
			? or(
					ilike(userTable.name, containsPattern(term)),
					ilike(branches.name, containsPattern(term)),
					ilike(auditLogs.targetTable, containsPattern(term)),
					ilike(auditLogs.action, containsPattern(term)),
				)
			: undefined;

		const where = and(branch, action, target, search);

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
				.limit(args.pageSize)
				.offset(args.page * args.pageSize),
			db
				.select({ value: count() })
				.from(auditLogs)
				.leftJoin(userTable, eq(auditLogs.actorId, userTable.id))
				.leftJoin(branches, eq(auditLogs.branchId, branches.id))
				.where(where),
		]);

		return { rows, total };
	},

	tables: async (ids: string[] | null) => {
		const scope = branchFilter(auditLogs, null, ids);
		const [tableRows, [{ value: total }]] = await Promise.all([
			db
				.selectDistinct({ targetTable: auditLogs.targetTable })
				.from(auditLogs)
				.where(scope)
				.orderBy(auditLogs.targetTable),
			db.select({ value: count() }).from(auditLogs).where(scope),
		]);
		return { tables: tableRows.map((r) => r.targetTable), total };
	},
};
