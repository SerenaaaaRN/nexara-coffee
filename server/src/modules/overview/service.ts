import type { CurrentUser } from "../../access/index.js";
import { getAccessibleBranchIds } from "../../access/index.js";
import { fail, ok } from "../../lib/http.js";
import { overviewRepo } from "./repository.js";

export const getOverviewDashboard = async (
	user: CurrentUser,
	branch?: string | null,
) => {
	const ids = await getAccessibleBranchIds(user.id, user.role);
	const branchId = branch ?? null;

	if (branchId && ids !== null && !ids.includes(branchId)) {
		return fail(403, "Forbidden branch access");
	}

	const startDate = new Date();
	startDate.setDate(startDate.getDate() - 7);
	const startDateStr = startDate.toISOString().split("T")[0];

	const result = await overviewRepo.dashboard({ branchId, ids, startDateStr });
	const {
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
	} = result;

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
		recentOrders,
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
	});
};
