import { and, asc, count, countDistinct, eq, ilike, notExists, or, sum } from "drizzle-orm";
import { branchFilter } from "../../access/index.js";
import { db } from "../../db/index.js";
import { user as userTable } from "../../db/schema/auth-schema.js";
import { branches } from "../../db/schema/branches.js";
import { employeeDetails } from "../../db/schema/employee.js";
import type { TableSortDir } from "../../lib/schema.js";
import { toSort } from "../../lib/sort.js";
import { containsPattern } from "../../lib/table.js";

/**
 * Columns addressable through `sortBy`. Values outside this map resolve
 * to the default ordering.
 */
const EMPLOYEE_SORT_COLUMNS = {
	createdAt: employeeDetails.createdAt,
	hireDate: employeeDetails.hireDate,
	baseSalary: employeeDetails.baseSalary,
	"user.name": userTable.name,
	"user.email": userTable.email,
	"user.role": userTable.role,
	branchId: branches.name,
} as const;

export type EmployeeListArgs = {
	ids: string[] | null;
	branchId?: string;
	role?: string;
	q?: string;
	sortBy?: string;
	sortDir: TableSortDir;
	page: number;
	pageSize: number;
};

const listColumns = {
	id: employeeDetails.id,
	userId: employeeDetails.userId,
	branchId: employeeDetails.branchId,
	baseSalary: employeeDetails.baseSalary,
	hireDate: employeeDetails.hireDate,
	createdAt: employeeDetails.createdAt,
	userName: userTable.name,
	userEmail: userTable.email,
	userRole: userTable.role,
	branchName: branches.name,
};

export type NewEmployee = typeof employeeDetails.$inferInsert;
export type EmployeePatch = Partial<typeof employeeDetails.$inferInsert>;

export const employeeRepo = {
	list: async (args: EmployeeListArgs) => {
		const branch = branchFilter(employeeDetails, args.branchId ?? null, args.ids);
		const role = args.role ? eq(userTable.role, args.role) : undefined;

		const term = args.q?.trim();
		const search = term
			? or(
					ilike(userTable.name, containsPattern(term)),
					ilike(userTable.email, containsPattern(term)),
					ilike(userTable.role, containsPattern(term)),
					ilike(branches.name, containsPattern(term)),
				)
			: undefined;

		const where = and(branch, role, search);
		const orderBy = toSort(
			EMPLOYEE_SORT_COLUMNS,
			args.sortBy,
			args.sortDir,
			asc(employeeDetails.hireDate),
		);

		const [rows, [{ value: total }], [{ value: salaryTotal }], [{ value: branchTotal }]] =
			await Promise.all([
				db
					.select(listColumns)
					.from(employeeDetails)
					.leftJoin(userTable, eq(employeeDetails.userId, userTable.id))
					.leftJoin(branches, eq(employeeDetails.branchId, branches.id))
					.where(where)
					.orderBy(orderBy)
					.limit(args.pageSize)
					.offset(args.page * args.pageSize),
				db
					.select({ value: count() })
					.from(employeeDetails)
					.leftJoin(userTable, eq(employeeDetails.userId, userTable.id))
					.leftJoin(branches, eq(employeeDetails.branchId, branches.id))
					.where(where),
				db
					.select({ value: sum(employeeDetails.baseSalary) })
					.from(employeeDetails)
					.leftJoin(userTable, eq(employeeDetails.userId, userTable.id))
					.where(where),
				db
					.select({ value: countDistinct(employeeDetails.branchId) })
					.from(employeeDetails)
					.leftJoin(userTable, eq(employeeDetails.userId, userTable.id))
					.where(where),
			]);

		return { rows, total, salaryTotal, branchTotal };
	},

	findById: async (id: string) => {
		const [row] = await db
			.select({
				id: employeeDetails.id,
				branchId: employeeDetails.branchId,
			})
			.from(employeeDetails)
			.where(eq(employeeDetails.id, id))
			.limit(1);
		return row ?? null;
	},

	findByUserId: async (userId: string) => {
		const [row] = await db
			.select({ id: employeeDetails.id })
			.from(employeeDetails)
			.where(eq(employeeDetails.userId, userId))
			.limit(1);
		return row ?? null;
	},

	create: async (payload: NewEmployee) => {
		const [row] = await db
			.insert(employeeDetails)
			.values(payload)
			.returning();
		return row ?? null;
	},

	update: async (id: string, patch: EmployeePatch) => {
		const [row] = await db
			.update(employeeDetails)
			.set(patch)
			.where(eq(employeeDetails.id, id))
			.returning();
		return row ?? null;
	},

	remove: async (id: string) => {
		await db.delete(employeeDetails).where(eq(employeeDetails.id, id));
	},

	availableUsers: async () => {
		return db
			.select({
				id: userTable.id,
				name: userTable.name,
				email: userTable.email,
				role: userTable.role,
			})
			.from(userTable)
			.where(
				notExists(
					db
						.select({ userId: employeeDetails.userId })
						.from(employeeDetails)
						.where(eq(employeeDetails.userId, userTable.id)),
				),
			)
			.orderBy(userTable.name);
	},

	branches: async () => {
		return db
			.select({ id: branches.id, name: branches.name })
			.from(branches)
			.orderBy(branches.name);
	},
};
