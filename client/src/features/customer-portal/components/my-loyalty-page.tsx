import { Award, ShoppingBag, Star } from "lucide-react";
import { SectionHeader } from "@/components/shared/section-header";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useMyLoyalty } from "@/features/customer-portal/hooks/useCustomerPortalQueries";
import { formatLabel } from "@/utils/format";

const TIER_PERKS: Record<string, string[]> = {
    bronze: ["Kumpulkan poin tiap pembelian", "Promo member bulanan"],
    silver: ["Semua perks Bronze", "Gratis 1 minuman tiap 10 kunjungan"],
    gold: ["Semua perks Silver", "Prioritas antrean + gratis dessert bulanan"],
    platinum: ["Semua perks Gold", "Undangan event + menu eksklusif"],
};

export function MyLoyaltyPage() {
    const { data: response } = useMyLoyalty();

    if (!response.success) throw new Error(response.error);
    const loyalty = response.data;
    const perks = TIER_PERKS[loyalty.loyaltyTier] ?? TIER_PERKS.bronze;

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Member"
                subtitle="Poin dan tier loyalty kamu."
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <StatCard
                    label="Poin"
                    value={loyalty.loyaltyPoints.toLocaleString("id-ID")}
                    icon={Star}
                />
                <StatCard
                    label="Total Order"
                    value={loyalty.orderCount}
                    icon={ShoppingBag}
                />
                <StatCard
                    label="Segmen"
                    value={formatLabel(loyalty.segment)}
                    icon={Award}
                />
            </div>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>{loyalty.fullName}</CardTitle>
                        <Badge
                            variant={
                                loyalty.loyaltyTier as
                                    | "bronze"
                                    | "silver"
                                    | "gold"
                                    | "platinum"
                            }>
                            {formatLabel(loyalty.loyaltyTier)}
                        </Badge>
                    </div>
                    <CardDescription>
                        Keuntungan tier {formatLabel(loyalty.loyaltyTier)} kamu.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                        {perks.map((perk) => (
                            <li key={perk}>{perk}</li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
