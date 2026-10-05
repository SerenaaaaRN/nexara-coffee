import { and, asc, count, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import type { CurrentUser } from "../../access/index.js";
import { ok, fail } from "../../lib/http.js";
import { branches as br } from "../../db/schema/branches.js";
import { customers } from "../../db/schema/customers.js";
import { transactions } from "../../db/schema/finance.js";
import { menuCategories, menuItems } from "../../db/schema/menu.js";
import { dailySetorans, orderItems, orders } from "../../db/schema/orders.js";

import {
	branchFilter,
	getAccessibleBranchIds,
} from "../../access/index.js";

export const getOverviewDashboard = async (
	user: CurrentUser,
	branch?: string | null,
) => {

	const ids = await getAccessibleBranchIds(user.id, user.role);
	const branchId = branch ?? null;

	if (branchId && ids !== null && !ids.includes(branchId)) {
		return fail(403, "Forbidden branch access",);
	}

	const startDate = new Date();
	startDate.setDate(startDate.getDate() - 7);
	const startDateStr = startDate.toISOString().split("T")[0];

	const [
		revenueRow,
		ordersRow,
		activeRow,
		revenueData,
		branchRevenue,
		paymentMethods,
		orderStatuses,
		shiftData,
		topItems,
		recentOrders,
		customerTiers,
		categoryPerf,
		branchRanking,
	] = await Promise.all([
		db
			.select({
				value: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
			})
			.from(transactions)
			.where(
				and(
					eq(transactions.status, "completed"),
					branchFilter(transactions, branchId, ids),
				),
			),

		db
			.select({
				cnt: count(),
				avg: sql<number>`COALESCE(AVG(${orders.totalAmount}), 0)`,
			})
			.from(orders)
			.where(branchFilter(orders, branchId, ids)),

		db.select({ cnt: count() }).from(br).where(eq(br.status, "active")),

		db
			.select({
				date: dailySetorans.date,
				revenue: sql<number>`COALESCE(SUM(${dailySetorans.amount}), 0)`,
			})
			.from(dailySetorans)
			.where(
				and(
					eq(dailySetorans.status, "approved"),
					gte(dailySetorans.date, startDateStr),
					branchFilter(dailySetorans, branchId, ids),
				),
			)
			.groupBy(dailySetorans.date)
			.orderBy(asc(dailySetorans.date)),

		db
			.select({
				branch: br.name,
				total: sql<number>`COALESCE(SUM(${dailySetorans.amount}), 0)`,
				count: count(),
			})
			.from(dailySetorans)
			.innerJoin(br, eq(dailySetorans.branchId, br.id))
			.where(
				and(
					eq(dailySetorans.status, "approved"),
					branchFilter(dailySetorans, branchId, ids),
				),
			)
			.groupBy(br.id, br.name)
			.orderBy(desc(sql`COALESCE(SUM(${dailySetorans.amount}), 0)`)),

		db
			.select({
				method: transactions.paymentMethod,
				count: count(),
				amount: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
			})
			.from(transactions)
			.where(branchFilter(transactions, branchId, ids))
			.groupBy(transactions.paymentMethod)
			.orderBy(desc(count())),

		db
			.select({ status: orders.status, count: count() })
			.from(orders)
			.where(branchFilter(orders, branchId, ids))
			.groupBy(orders.status)
			.orderBy(desc(count())),

		db
			.select({
				count: count(),
				amount: sql<number>`COALESCE(SUM(${dailySetorans.amount}), 0)`,
			})
			.from(dailySetorans)
			.where(
				and(
					eq(dailySetorans.status, "approved"),
					branchFilter(dailySetorans, branchId, ids),
				),
			),

		db
			.select({
				name: orderItems.nameSnapshot,
				qty: sql<number>`COALESCE(SUM(${orderItems.qty}), 0)`,
				revenue: sql<number>`COALESCE(SUM(${orderItems.subtotal}), 0)`,
			})
			.from(orderItems)
			.innerJoin(orders, eq(orderItems.orderId, orders.id))
			.where(branchFilter(orders, branchId, ids))
			.groupBy(orderItems.nameSnapshot)
			.orderBy(desc(sql`COALESCE(SUM(${orderItems.qty}), 0)`))
			.limit(5),

		db
			.select({
				id: orders.id,
				orderNumber: orders.orderNumber,
				status: orders.status,
				totalAmount: orders.totalAmount,
				branchName: br.name,
				createdAt: orders.createdAt,
			})
			.from(orders)
			.innerJoin(br, eq(orders.branchId, br.id))
			.where(branchFilter(orders, branchId, ids))
			.orderBy(desc(orders.createdAt))
			.limit(5),

		db
			.select({ tier: customers.loyaltyTier, count: count() })
			.from(customers)
			.groupBy(customers.loyaltyTier)
			.orderBy(desc(count())),

		db
			.select({
				category: menuCategories.name,
				qty: sql<number>`COALESCE(SUM(${orderItems.qty}), 0)`,
				revenue: sql<number>`COALESCE(SUM(${orderItems.subtotal}), 0)`,
			})
			.from(orderItems)
			.innerJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
			.innerJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
			.innerJoin(orders, eq(orderItems.orderId, orders.id))
			.where(branchFilter(orders, branchId, ids))
			.groupBy(menuCategories.id, menuCategories.name)
			.orderBy(desc(sql`COALESCE(SUM(${orderItems.qty}), 0)`)),

		db
			.select({
				branchId: br.id,
				branch: br.name,
				revenue: sql<number>`COALESCE(SUM(${dailySetorans.amount}), 0)`,
				setoranCount: count(),
			})
			.from(dailySetorans)
			.innerJoin(br, eq(dailySetorans.branchId, br.id))
			.where(
				and(
					eq(dailySetorans.status, "approved"),
					branchFilter(dailySetorans, branchId, ids),
				),
			)
			.groupBy(br.id, br.name)
			.orderBy(desc(sql`COALESCE(SUM(${dailySetorans.amount}), 0)`)),
	]);

	return ok({
			stats: {
				totalRevenue: Number(revenueRow?.[0]?.value ?? 0),
				totalOrders: Number(ordersRow?.[0]?.cnt ?? 0),
				activeBranches: Number(activeRow?.[0]?.cnt ?? 0),
				avgOrderValue: Number(ordersRow?.[0]?.avg ?? 0),
			},
			revenueData: revenueData.map((x) => ({
				date: x.date,
				revenue: Number(x.revenue),
			})),
			branchRevenue: branchRevenue.map((x) => ({
				branch: x.branch,
				total: Number(x.total),
				count: x.count,
			})),
			paymentMethods: paymentMethods.map((x) => ({
				method: x.method,
				count: x.count,
				amount: Number(x.amount),
			})),
			orderStatuses: orderStatuses.map((x) => ({
				status: x.status,
				count: x.count,
			})),
			shiftData: shiftData.map((x) => ({
				count: x.count,
				amount: Number(x.amount),
			})),
			topItems: topItems.map((x) => ({
				name: x.name,
				qty: Number(x.qty),
				revenue: Number(x.revenue),
			})),
			recentOrders: recentOrders as unknown as typeof recentOrders,
			customerTiers: customerTiers.map((x) => ({
				tier: x.tier,
				count: x.count,
			})),
			categoryPerf: categoryPerf.map((x) => ({
				category: x.category,
				qty: Number(x.qty),
				revenue: Number(x.revenue),
			})),
			branchRanking: branchRanking.map((x) => ({
				branchId: x.branchId,
				branch: x.branch,
				revenue: Number(x.revenue),
				setoranCount: x.setoranCount,
			})),
		},);
};
