import { Coffee, MapPin, UtensilsCrossed } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";

interface LandingStatsProps {
    branchCount: number;
    menuCount: number;
    categoryCount: number;
}

export const LandingStats = ({
    branchCount,
    menuCount,
    categoryCount,
}: LandingStatsProps) => {
    return (
        <section aria-label="Ringkasan Nexara Coffee">
            <div className="mx-auto grid max-w-7xl gap-4 px-4 pb-4 md:grid-cols-3 md:px-6">
                <StatCard
                    label="Cabang aktif"
                    value={branchCount}
                    icon={MapPin}
                />
                <StatCard
                    label="Menu tersedia"
                    value={menuCount}
                    icon={UtensilsCrossed}
                />
                <StatCard
                    label="Kategori menu"
                    value={categoryCount}
                    icon={Coffee}
                />
            </div>
        </section>
    );
};
