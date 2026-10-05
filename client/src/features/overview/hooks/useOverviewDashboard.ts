import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import type { OverviewData } from "@/features/overview/types";
import { overviewKeys } from "@/features/query-keys";
import { STALE } from "@/features/stale-time";
import { api, toEnvelope } from "@/lib/eden";

/**
 * Mengambil SELURUH data halaman overview dalam satu panggilan.
 */
export const getOverviewDashboard = async (branch?: string | null) => {
    const { data, error } = await api.overview.dashboard.get({
        query: branch ? { branch } : {},
    });
    const envelope = toEnvelope(data, error);
    if (!envelope.success) return envelope;
    const r = envelope.data;
    return {
        success: true as const,
        data: {
            stats: r.stats,
            revenueData: r.revenueData,
            branchRevenue: r.branchRevenue.map((x) => ({
                ...x,
                count: Number(x.count),
            })),
            paymentMethods: r.paymentMethods.map((x) => ({
                ...x,
                count: Number(x.count),
            })),
            orderStatuses: r.orderStatuses.map((x) => ({
                ...x,
                count: Number(x.count),
            })),
            shiftData: r.shiftData.map((x) => ({
                ...x,
                count: Number(x.count),
            })),
            topItems: r.topItems,
            recentOrders: r.recentOrders.map((x) => ({
                ...x,
                totalAmount: String(x.totalAmount),
            })),
            customerTiers: r.customerTiers.map((x) => ({
                ...x,
                count: Number(x.count),
            })),
            categoryPerf: r.categoryPerf,
            branchRanking: r.branchRanking.map((x) => ({
                ...x,
                setoranCount: Number(x.setoranCount),
            })),
        } satisfies OverviewData,
    };
};

export const overviewDashboardOptions = (branch?: string | null) =>
    queryOptions({
        queryKey: overviewKeys.dashboard(branch),
        queryFn: () => getOverviewDashboard(branch),
        staleTime: STALE.SLOW,
    });

/** @see {@link getOverviewDashboard} */
export function useOverviewDashboard(branch?: string | null) {
    return useSuspenseQuery(overviewDashboardOptions(branch));
}
