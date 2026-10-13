import { and, asc, avg, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "../../db/index.js";
import { branches } from "../../db/schema/branches.js";
import { customers, reviews } from "../../db/schema/customers.js";
import type { TableSortDir } from "../../lib/schema.js";
import { toSort } from "../../lib/sort.js";
import { containsPattern } from "../../lib/table.js";

const REVIEW_SORT_COLUMNS = {
	createdAt: reviews.createdAt,
	rating: reviews.rating,
	status: reviews.status,
} as const;

export type ReviewListArgs = {
	branchId?: string;
	status?: string;
	rating?: number;
	q?: string;
	sortBy?: string;
	sortDir: TableSortDir;
	page: number;
	pageSize: number;
};

const listColumns = {
	id: reviews.id,
	branchId: reviews.branchId,
	customerId: reviews.customerId,
	orderId: reviews.orderId,
	rating: reviews.rating,
	comment: reviews.comment,
	status: reviews.status,
	reply: reviews.reply,
	createdAt: reviews.createdAt,
	branchName: branches.name,
	customerName: customers.fullName,
};

export const reviewRepo = {
	list: async (args: ReviewListArgs) => {
		const branch = args.branchId ? eq(reviews.branchId, args.branchId) : undefined;
		const status = args.status ? eq(reviews.status, args.status) : undefined;
		const rating = args.rating != null ? eq(reviews.rating, args.rating) : undefined;

		const term = args.q?.trim();
		const search = term
			? or(
					ilike(customers.fullName, containsPattern(term)),
					ilike(branches.name, containsPattern(term)),
					ilike(reviews.comment, containsPattern(term)),
				)
			: undefined;

		const where = and(branch, status, rating, search);
		const orderBy = toSort(
			REVIEW_SORT_COLUMNS,
			args.sortBy,
			args.sortDir,
			args.sortDir === "asc" ? asc(reviews.createdAt) : desc(reviews.createdAt),
		);

		const [rows, [{ value: total }], statusGroups, [{ value: average }]] =
			await Promise.all([
				db
					.select(listColumns)
					.from(reviews)
					.leftJoin(branches, eq(reviews.branchId, branches.id))
					.leftJoin(customers, eq(reviews.customerId, customers.id))
					.where(where)
					.orderBy(orderBy)
					.limit(args.pageSize)
					.offset(args.page * args.pageSize),
				db
					.select({ value: count() })
					.from(reviews)
					.leftJoin(branches, eq(reviews.branchId, branches.id))
					.leftJoin(customers, eq(reviews.customerId, customers.id))
					.where(where),
				db
					.select({ status: reviews.status, value: count() })
					.from(reviews)
					.leftJoin(branches, eq(reviews.branchId, branches.id))
					.leftJoin(customers, eq(reviews.customerId, customers.id))
					.where(where)
					.groupBy(reviews.status),
				db.select({ value: avg(reviews.rating) }).from(reviews).where(where),
			]);

		return { rows, total, statusGroups, average };
	},

	setReply: async (id: string, reply: string | null) => {
		const [row] = await db
			.update(reviews)
			.set({ reply })
			.where(eq(reviews.id, id))
			.returning();
		return row ?? null;
	},

	setStatus: async (id: string, status: "approved" | "rejected") => {
		const [row] = await db
			.update(reviews)
			.set({ status })
			.where(eq(reviews.id, id))
			.returning();
		return row ?? null;
	},
};
