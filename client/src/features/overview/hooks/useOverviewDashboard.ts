import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import type {
    BranchRankingRow,
    BranchRevenue,
    CategoryPerformance,
    CustomerTierItem,
    OrderStatusItem,
    OverviewData,
    PaymentMethodItem,
    RecentOrderRow,
    RevenuePoint,
    ShiftBreakdown,
    TopItemRow,
} from "@/features/overview/types";
import { overviewKeys } from "@/features/query-keys";
import { STALE } from "@/features/stale-time";
import { resolveOverviewScope } from "./overview-scope";

interface OverviewRpcResult {
    revenue: number | string;
    ordersAgg: { cnt: number | string; avg: number | string };
    activeBranches: number | string;
    revenueData: { date: string; revenue: number | string }[];
    branchRevenue: {
        branch: string;
        total: number | string;
        count: number | string;
    }[];
    paymentMethods: {
        method: string;
        count: number | string;
        amount: number | string;
    }[];
    orderStatuses: { status: string; count: number | string }[];
    shiftData: { count: number | string; amount: number | string }[];
    topItems: {
        name: string;
        qty: number | string;
        revenue: number | string;
    }[];
    recentOrders: {
        id: string;
        orderNumber: string;
        status: string;
        totalAmount: number | string;
        branchName: string;
        createdAt: string;
    }[];
    customerTiers: { tier: string; count: number | string }[];
    categoryPerf: {
        category: string;
        qty: number | string;
        revenue: number | string;
    }[];
    branchRanking: {
        branchId: string;
        branch: string;
        revenue: number | string;
        setoranCount: number | string;
    }[];
}

/**
 * Mengambil SELURUH data halaman overview dalam satu function.
 *
 * Agregasi dikerjakan di database via fungsi `get_overview_dashboard`
 * (database/migration/0001_overview_dashboard.sql) — 1x rpc call
 * menggantikan 13 query terpisah.
 *
 * @param branch - Filter berdasarkan id cabang (opsional)
 * @returns {OverviewData} Seluruh dataset ringkasan dashboard
 */
export const getOverviewDashboardFn = createServerFn({ method: "GET" })
    .validator((data: { branch?: string | null }) => data)
    .handler(async ({ data: { branch } }) => {
        const scope = await resolveOverviewScope(branch);
        if (!scope.success)
            return { success: false as const, error: scope.error };
        const { ids, branchId } = scope;

        const { supabaseAdmin } = await import("@database/server");

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        const startDateStr = startDate.toISOString().split("T")[0];

        const { data: result, error } = await supabaseAdmin.rpc(
            "get_overview_dashboard",
            {
                p_branch_id: branchId,
                p_branch_ids: ids,
                p_start_date: startDateStr,
            },
        );

        if (error || !result)
            return {
                success: false as const,
                error: error?.message ?? "Gagal memuat dashboard",
            };

        const r = result as unknown as OverviewRpcResult;

        return {
            success: true as const,
            data: {
                stats: {
                    totalRevenue: Number(r.revenue ?? 0),
                    totalOrders: Number(r.ordersAgg?.cnt ?? 0),
                    activeBranches: Number(r.activeBranches ?? 0),
                    avgOrderValue: Number(r.ordersAgg?.avg ?? 0),
                },
                revenueData: (r.revenueData ?? []).map((x) => ({
                    date: x.date,
                    revenue: Number(x.revenue),
                })) as RevenuePoint[],
                branchRevenue: (r.branchRevenue ?? []).map((x) => ({
                    branch: x.branch,
                    total: Number(x.total),
                    count: Number(x.count),
                })) as BranchRevenue[],
                paymentMethods: (r.paymentMethods ?? []).map((x) => ({
                    method: x.method,
                    count: Number(x.count),
                    amount: Number(x.amount),
                })) as PaymentMethodItem[],
                orderStatuses: (r.orderStatuses ?? []).map((x) => ({
                    status: x.status,
                    count: Number(x.count),
                })) as OrderStatusItem[],
                shiftData: (r.shiftData ?? []).map((x) => ({
                    count: Number(x.count),
                    amount: Number(x.amount),
                })) as ShiftBreakdown[],
                topItems: (r.topItems ?? []).map((x) => ({
                    name: x.name,
                    qty: Number(x.qty),
                    revenue: Number(x.revenue),
                })) as TopItemRow[],
                recentOrders: (r.recentOrders ?? []).map((x) => ({
                    id: x.id,
                    orderNumber: x.orderNumber,
                    status: x.status,
                    totalAmount: String(x.totalAmount),
                    branchName: x.branchName,
                    createdAt: x.createdAt,
                })) as unknown as RecentOrderRow[],
                customerTiers: (r.customerTiers ?? []).map((x) => ({
                    tier: x.tier,
                    count: Number(x.count),
                })) as CustomerTierItem[],
                categoryPerf: (r.categoryPerf ?? []).map((x) => ({
                    category: x.category,
                    qty: Number(x.qty),
                    revenue: Number(x.revenue),
                })) as CategoryPerformance[],
                branchRanking: (r.branchRanking ?? []).map((x) => ({
                    branchId: x.branchId,
                    branch: x.branch,
                    revenue: Number(x.revenue),
                    setoranCount: Number(x.setoranCount),
                })) as BranchRankingRow[],
            } satisfies OverviewData,
        };
    });

export const overviewDashboardOptions = (branch?: string | null) =>
    queryOptions({
        queryKey: overviewKeys.dashboard(branch),
        queryFn: () => getOverviewDashboardFn({ data: { branch } }),
        staleTime: STALE.SLOW,
    });

/** @see {@link getOverviewDashboardFn} */
export function useOverviewDashboard(branch?: string | null) {
    return useSuspenseQuery(overviewDashboardOptions(branch));
}
