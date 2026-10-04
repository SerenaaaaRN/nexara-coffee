import { Star, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Empty,
    EmptyDescription,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";
import type { CustomerRow, LoyaltyTier } from "@/features/customers/types";
import {
    getAvatarColor,
    getInitials,
    TIER_COLORS,
} from "@/features/customers/utils";
import { cn } from "@/utils/cn";
import { formatLabel, pluralize } from "@/utils/format";

type CustomerGridProps = {
    customers: CustomerRow[];
    filtered: CustomerRow[];
    selectedId: string | undefined;
    onSelect: (id: string | null) => void;
};

export const CustomerGrid = ({
    customers,
    filtered,
    selectedId,
    onSelect,
}: CustomerGridProps) => {
    if (customers.length === 0) {
        return (
            <Empty>
                <EmptyMedia variant="icon">
                    <Users />
                </EmptyMedia>
                <EmptyTitle>No customers yet</EmptyTitle>
                <EmptyDescription>
                    Add your first customer to get started.
                </EmptyDescription>
            </Empty>
        );
    }

    if (filtered.length === 0) {
        return (
            <Empty>
                <EmptyMedia variant="icon">
                    <Users />
                </EmptyMedia>
                <EmptyTitle>No matching customers</EmptyTitle>
                <EmptyDescription>
                    Try adjusting your search or filters.
                </EmptyDescription>
            </Empty>
        );
    }

    return (
        <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((c) => (
                    <button
                        type="button"
                        key={c.id}
                        onClick={() =>
                            onSelect(c.id === selectedId ? null : c.id)
                        }
                        className={cn(
                            "flex w-full cursor-pointer flex-col gap-2.5 rounded-lg border p-3.5 text-left transition-all",
                            c.id === selectedId
                                ? "border-primary bg-primary/3 shadow-sm ring-1 ring-primary/20"
                                : "border-border bg-card hover:border-muted-foreground/30 hover:shadow-sm",
                        )}>
                        <div className="flex items-start gap-3">
                            <div
                                className={cn(
                                    "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                                    getAvatarColor(c.fullName),
                                )}>
                                {getInitials(c.fullName)}
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                    <span className="truncate text-sm font-medium">
                                        {c.fullName}
                                    </span>
                                </div>
                                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "h-5 gap-0.5 border-0 px-1.5 text-[10px] font-medium",
                                            TIER_COLORS[
                                                c.loyaltyTier as LoyaltyTier
                                            ] ?? TIER_COLORS.bronze,
                                        )}>
                                        <Star className="size-2.5" />
                                        {formatLabel(c.loyaltyTier)}
                                    </Badge>
                                    <Badge
                                        variant="secondary"
                                        className="h-5 px-1.5 text-[10px] font-medium capitalize">
                                        {formatLabel(c.segment)}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {c.email || c.phone ? (
                            <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                                {c.email ? (
                                    <span className="truncate">{c.email}</span>
                                ) : null}
                                {c.phone ? (
                                    <span className="truncate">{c.phone}</span>
                                ) : null}
                            </div>
                        ) : null}

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="font-medium tabular-nums text-foreground">
                                {c.loyaltyPoints.toLocaleString("id-ID")} pts
                            </span>
                            <span className="flex items-center gap-1">
                                <Users className="size-3" />
                                {c.orderCount} order
                                {c.orderCount !== 1 ? "s" : ""}
                            </span>
                        </div>
                    </button>
                ))}
            </div>
            <p className="text-sm text-muted-foreground">
                Showing {filtered.length}{" "}
                {pluralize(filtered.length, "customer")}
            </p>
        </>
    );
};
