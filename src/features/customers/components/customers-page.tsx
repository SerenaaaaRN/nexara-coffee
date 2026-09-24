import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { StatCard } from "#/components/shared/stat-card";
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
import { CustomerGrid } from "@/features/customers/components/customer-grid";
import { CustomerSheet } from "@/features/customers/components/customer-sheet";
import { useCustomerFilters } from "@/features/customers/hooks/useCustomerFilters";
import { useCustomers } from "@/features/customers/hooks/useCustomerQueries";
import { CUSTOMER_SEGMENTS, LOYALTY_TIERS } from "@/features/customers/types";
import { formatLabel, pluralize } from "@/utils/format";

const routeApi = getRouteApi("/_dashboard/customers");

export const CustomersPage = () => {
    const { customer } = routeApi.useSearch();
    const navigate = useNavigate();
    const { data } = useCustomers();

    if (!data.success) throw new Error(data.error);
    const customers = data.data;
    const {
        search,
        setSearch,
        segmentFilter,
        setSegmentFilter,
        tierFilter,
        setTierFilter,
        filtered,
        hasFilters,
        totalOrders,
        totalPoints,
        clearFilters,
    } = useCustomerFilters(customers);

    const selectedCustomer = customer
        ? (customers.find((c) => c.id === customer) ?? null)
        : null;

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

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Customers"
                subtitle="Manage customers and loyalty program."
            />

            <div className="flex flex-col gap-4">
                {customers.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <StatCard
                            label="Total Customers"
                            value={filtered.length}
                        />
                        <StatCard label="Total Orders" value={totalOrders} />
                        <StatCard
                            label="Loyalty Points"
                            value={totalPoints.toLocaleString("id-ID")}
                        />
                    </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-3">
                    <Input
                        placeholder="Search customers..."
                        value={search}
                        onChange={(e) =>
                            onFilterChange(setSearch)(e.target.value)
                        }
                        className="w-full max-w-xs"
                    />
                    <Select
                        value={segmentFilter}
                        onValueChange={onFilterChange(setSegmentFilter)}
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
                        value={tierFilter}
                        onValueChange={onFilterChange(setTierFilter)}
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

                {hasFilters ? (
                    <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">
                            {filtered.length} of {customers.length}{" "}
                            {pluralize(customers.length, "customer")}
                        </p>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={clearFilters}>
                            Clear filters
                        </Button>
                    </div>
                ) : null}

                <CustomerGrid
                    customers={customers}
                    filtered={filtered}
                    selectedId={customer}
                    onSelect={onSelect}
                />

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
