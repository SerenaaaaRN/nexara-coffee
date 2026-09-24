import {
    DollarSign,
    ShoppingCart,
    Store,
    TrendingDown,
    TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { OverviewStats } from "@/features/overview/types";
import { formatCurrency } from "@/utils/format";

function StatSkeleton() {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-8 w-20" />
            </CardContent>
        </Card>
    );
}

export function StatCards({ stats }: { stats: OverviewStats | null }) {
    if (!stats) {
        return (
            <div
                className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
                data-tour="overview-stats">
                {[1, 2, 3, 4].map((n) => (
                    <StatSkeleton key={`skel-${n}`} />
                ))}
            </div>
        );
    }

    const cards = [
        {
            title: "Total Revenue",
            value: formatCurrency(stats.totalRevenue),
            icon: DollarSign,
        },
        {
            title: "Total Orders",
            value: String(stats.totalOrders),
            icon: ShoppingCart,
        },
        {
            title: "Active Branches",
            value: String(stats.activeBranches),
            icon: Store,
        },
        {
            title: "Avg Order Value",
            value: formatCurrency(stats.avgOrderValue),
            icon: stats.avgOrderValue > 0 ? TrendingUp : TrendingDown,
        },
    ];

    return (
        <div
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
            data-tour="overview-stats">
            {cards.map((card) => {
                const Icon = card.icon;
                return (
                    <Card key={card.title} className="shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                {card.title}
                            </CardTitle>
                            <Icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {card.value}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
