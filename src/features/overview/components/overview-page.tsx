import { getRouteApi } from "@tanstack/react-router";
import { useState } from "react";
import { SectionHeader } from "@/components/shared/section-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    CategoryRadarChart,
    CustomerTierChart,
    OrderStatusChart,
    PaymentMethodChart,
    RevenueAreaChart,
    RevenueByBranchChart,
    SetoranShiftChart,
    TopItemsChart,
} from "@/features/overview/components/overview-charts";
import { StatCards } from "@/features/overview/components/overview-stats";
import {
    BranchRankingTable,
    RecentOrdersTable,
} from "@/features/overview/components/overview-tables";
import { useOverviewDashboard } from "@/features/overview/hooks/useOverviewDashboard";
import type { OverviewData } from "@/features/overview/types";

const routeApi = getRouteApi("/_dashboard/overview");

function RevenueTab({ d }: { d: OverviewData }) {
    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
                <RevenueByBranchChart data={d.branchRevenue} />
                <PaymentMethodChart data={d.paymentMethods} />
            </div>
            <RevenueAreaChart data={d.revenueData} />
        </div>
    );
}

function OrdersTab({ d }: { d: OverviewData }) {
    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
                <OrderStatusChart data={d.orderStatuses} />
                <SetoranShiftChart data={d.shiftData} />
            </div>
            <TopItemsChart data={d.topItems} />
            <RecentOrdersTable data={d.recentOrders} />
        </div>
    );
}

function AnalyticsTab({ d }: { d: OverviewData }) {
    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
                <CategoryRadarChart data={d.categoryPerf} />
                <CustomerTierChart data={d.customerTiers} />
            </div>
            <BranchRankingTable data={d.branchRanking} />
        </div>
    );
}

export function OverviewPage() {
    const { branch } = routeApi.useSearch();
    const [tab, setTab] = useState("revenue");
    const { data } = useOverviewDashboard(branch);

    if (!data?.success)
        return (
            <p className="text-destructive">
                {data?.error ?? "Failed to load"}
            </p>
        );

    const d = data.data;

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Overview"
                subtitle="Real-time overview of your cafe network performance."
            />

            <StatCards stats={d.stats} />

            <Tabs value={tab} onValueChange={setTab} data-tour="overview-tabs">
                <TabsList>
                    <TabsTrigger value="revenue">Revenue</TabsTrigger>
                    <TabsTrigger value="orders">Orders</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="revenue" className="mt-4">
                    <RevenueTab d={d} />
                </TabsContent>

                <TabsContent value="orders" className="mt-4">
                    <OrdersTab d={d} />
                </TabsContent>

                <TabsContent value="analytics" className="mt-4">
                    <AnalyticsTab d={d} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
