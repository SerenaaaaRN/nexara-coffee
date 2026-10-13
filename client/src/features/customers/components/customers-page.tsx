import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { StatCard } from "@/components/shared/stat-card";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CustomersSkeleton } from "@/components/fallbacks/dashboard";
import { CustomerGrid } from "@/features/customers/components/customer-grid";
import { CustomerSheet } from "@/features/customers/components/customer-sheet";
import { useCustomerFilters } from "@/features/customers/hooks/useCustomerFilters";
import {
    useCustomerDetail,
    useCustomersInfinite,
} from "@/features/customers/hooks/useCustomerQueries";
import { CUSTOMER_SEGMENTS, LOYALTY_TIERS } from "@/features/customers/types";
import { formatLabel, pluralize } from "@/utils/format";
import { useEffect, useRef } from "react";

const routeApi = getRouteApi("/_dashboard/customers");

export const CustomersPage = () => {
    const { customer } = routeApi.useSearch();
    const navigate = useNavigate();
    const filters = useCustomerFilters();

    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending } =
        useCustomersInfinite(filters.params);

    const pages = data?.pages ?? [];
    const firstPage = pages[0];
    const loadError = firstPage && !firstPage.success ? firstPage.error : null;
    const rows = pages.flatMap((p) => (p.success ? p.data.rows : []));
    const summary = firstPage?.success
        ? firstPage.data.summary
        : { total: 0, totalOrders: 0, totalPoints: 0 };

    const loadedSelected = customer
        ? (rows.find((c) => c.id === customer) ?? null)
        : null;
    const { data: detailData } = useCustomerDetail(
        customer ?? "",
        !!customer && !loadedSelected,
    );
    const selectedCustomer =
        loadedSelected ?? (detailData?.success ? detailData.data : null);

    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const el = loadMoreRef.current;
        if (!el || !hasNextPage || isFetchingNextPage) return;
        const io = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) fetchNextPage();
            },
            { rootMargin: "400px" },
        );
        io.observe(el);
        return () => io.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage, rows.length]);

    const onSelect = (id: string | null) => {
        navigate({
            to: ".",
            search: { customer: id ?? undefined },
            replace: true,
        });
    };

    const onFilterChange =
        (setter: (v: string) => void) => (value: string | null) => {
            setter(value ?? "all");
            onSelect(null);
        };

    if (isPending && rows.length === 0 && !loadError) {
        return <CustomersSkeleton />;
    }

    if (loadError) throw new Error(loadError);

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Customers"
                subtitle="Manage customers and loyalty program."
            />

            <div className="flex flex-col gap-4">
                {summary.total > 0 ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <StatCard
                            label="Total Customers"
                            value={summary.total}
                        />
                        <StatCard
                            label="Total Orders"
                            value={summary.totalOrders}
                        />
                        <StatCard
                            label="Loyalty Points"
                            value={summary.totalPoints.toLocaleString("id-ID")}
                        />
                    </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-3">
                    <Input
                        placeholder="Search customers..."
                        value={filters.search}
                        onChange={(e) =>
                            onFilterChange(filters.setSearch)(e.target.value)
                        }
                        className="w-full max-w-xs"
                    />
                    <Select
                        value={filters.segmentFilter}
                        onValueChange={onFilterChange(filters.setSegmentFilter)}
                        items={{
                            all: "All Segments",
                            ...Object.fromEntries(
                                CUSTOMER_SEGMENTS.map((s) => [
                                    s,
                                    formatLabel(s),
                                ]),
                            ),
                        }}>
                        <SelectTrigger className="w-36">
                            <SelectValue placeholder="All segments" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value="all">
                                    All Segments
                                </SelectItem>
                                {CUSTOMER_SEGMENTS.map((s) => (
                                    <SelectItem key={s} value={s}>
                                        {formatLabel(s)}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <Select
                        value={filters.tierFilter}
                        onValueChange={onFilterChange(filters.setTierFilter)}
                        items={{
                            all: "All Tiers",
                            ...Object.fromEntries(
                                LOYALTY_TIERS.map((t) => [t, formatLabel(t)]),
                            ),
                        }}>
                        <SelectTrigger className="w-36">
                            <SelectValue placeholder="All tiers" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value="all">All Tiers</SelectItem>
                                {LOYALTY_TIERS.map((t) => (
                                    <SelectItem key={t} value={t}>
                                        {formatLabel(t)}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>

                {filters.hasFilters ? (
                    <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">
                            {rows.length} of {summary.total}{" "}
                            {pluralize(summary.total, "customer")}
                        </p>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={filters.clearFilters}>
                            Clear filters
                        </Button>
                    </div>
                ) : null}

                <CustomerGrid
                    rows={rows}
                    total={summary.total}
                    hasActiveFilter={filters.hasFilters}
                    selectedId={customer}
                    onSelect={onSelect}
                />

                {hasNextPage ? (
                    <div ref={loadMoreRef} className="flex justify-center py-4">
                        <span className="text-sm text-muted-foreground">
                            {isFetchingNextPage
                                ? "Loading more customers..."
                                : "Scroll to load more"}
                        </span>
                    </div>
                ) : null}

                {selectedCustomer ? (
                    <CustomerSheet
                        key={selectedCustomer.id}
                        customer={selectedCustomer}
                        open={!!selectedCustomer}
                        onOpenChange={(open) => {
                            if (!open) onSelect(null);
                        }}
                    />
                ) : null}
            </div>
        </div>
    );
};
