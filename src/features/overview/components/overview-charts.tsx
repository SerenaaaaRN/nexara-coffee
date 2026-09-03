import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    PolarAngleAxis,
    PolarGrid,
    PolarRadiusAxis,
    Radar,
    RadarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import type {
    BranchRevenue,
    CategoryPerformance,
    CustomerTierItem,
    OrderStatusItem,
    PaymentMethodItem,
    RevenuePoint,
    ShiftBreakdown,
    TopItemRow,
} from "@/features/overview/types";
import { formatCurrency, formatDate, formatLabel } from "@/utils/format";

const dateTickFormatter = (v: string) => formatDate(v, { weekday: "short" });
const revenueKFormatter = (v: number) => `Rp${(v / 1000).toFixed(0)}k`;
const revenueMFormatter = (v: number) => `Rp${(v / 1000000).toFixed(0)}M`;

export function RevenueAreaChart({ data }: { data: RevenuePoint[] }) {
    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>
                    Daily revenue from approved setorans
                </CardDescription>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <EmptyChart />
                ) : (
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient
                                        id="revGrad"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1">
                                        <stop
                                            offset="5%"
                                            stopColor="var(--chart-1)"
                                            stopOpacity={0.35}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="var(--chart-1)"
                                            stopOpacity={0.02}
                                        />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    className="stroke-border/50"
                                />
                                <XAxis
                                    dataKey="date"
                                    tick={{
                                        fontSize: 12,
                                        fill: "var(--muted-foreground)",
                                    }}
                                    tickFormatter={dateTickFormatter}
                                />
                                <YAxis
                                    tick={{
                                        fontSize: 12,
                                        fill: "var(--muted-foreground)",
                                    }}
                                    tickFormatter={revenueKFormatter}
                                />
                                <Tooltip content={<ChartTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="var(--chart-1)"
                                    strokeWidth={2.5}
                                    fill="url(#revGrad)"
                                    dot={{ r: 3, fill: "var(--chart-1)" }}
                                    activeDot={{ r: 5 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export function RevenueByBranchChart({ data }: { data: BranchRevenue[] }) {
    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle>Revenue by Branch</CardTitle>
                <CardDescription>
                    Total approved setoran per branch
                </CardDescription>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <EmptyChart />
                ) : (
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} layout="vertical">
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    className="stroke-border/50"
                                />
                                <XAxis
                                    type="number"
                                    tick={{
                                        fontSize: 12,
                                        fill: "var(--muted-foreground)",
                                    }}
                                    tickFormatter={revenueMFormatter}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="branch"
                                    tick={{
                                        fontSize: 12,
                                        fill: "var(--muted-foreground)",
                                    }}
                                    width={90}
                                />
                                <Tooltip content={<ChartTooltip />} />
                                <Bar
                                    dataKey="total"
                                    radius={[0, 4, 4, 0]}
                                    maxBarSize={20}>
                                    {data.map((d, i) => (
                                        <Cell
                                            key={d.branch}
                                            fill="var(--chart-1)"
                                            fillOpacity={1 - i * 0.08}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

const PAYMENT_FILL: Record<string, string> = {
    cash: "var(--chart-4)",
    qris: "var(--chart-1)",
    debit: "var(--chart-6)",
    credit: "var(--chart-2)",
};

export function PaymentMethodChart({ data }: { data: PaymentMethodItem[] }) {
    const total = data.reduce((s, d) => s + d.count, 0);
    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>{total} transactions total</CardDescription>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <EmptyChart />
                ) : (
                    <div className="flex h-64 items-center gap-4">
                        <div className="relative h-48 w-48 shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={52}
                                        outerRadius={82}
                                        dataKey="count"
                                        nameKey="method"
                                        paddingAngle={2}
                                        strokeWidth={0}>
                                        {data.map((d) => (
                                            <Cell
                                                key={d.method}
                                                fill={
                                                    PAYMENT_FILL[d.method] ??
                                                    "var(--chart-7)"
                                                }
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<ChartTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-lg font-bold tabular-nums">
                                    {total.toLocaleString("id-ID")}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    Total
                                </span>
                            </div>
                        </div>
                        <div className="space-y-2 text-sm">
                            {data.map((d) => (
                                <div
                                    key={d.method}
                                    className="flex items-center gap-2">
                                    <span
                                        className="h-3 w-3 shrink-0 rounded-full"
                                        style={{
                                            backgroundColor:
                                                PAYMENT_FILL[d.method] ??
                                                "var(--chart-7)",
                                        }}
                                    />
                                    <span className="text-muted-foreground">
                                        {formatLabel(d.method)}
                                    </span>
                                    <span className="ml-auto font-medium tabular-nums">
                                        {d.count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

const STATUS_FILL: Record<string, string> = {
    completed: "var(--chart-1)",
    processing: "var(--chart-6)",
    pending: "var(--chart-5)",
    cancelled: "var(--chart-7)",
};

export function OrderStatusChart({ data }: { data: OrderStatusItem[] }) {
    const total = data.reduce((s, d) => s + d.count, 0);
    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle>Order Status</CardTitle>
                <CardDescription>{total} orders total</CardDescription>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <EmptyChart />
                ) : (
                    <div className="space-y-5">
                        {data.map((d) => {
                            const pct =
                                total > 0
                                    ? Math.round((d.count / total) * 100)
                                    : 0;
                            return (
                                <div key={d.status} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium">
                                            {formatLabel(d.status)}
                                        </span>
                                        <span className="text-muted-foreground tabular-nums">
                                            {d.count} ({pct}%)
                                        </span>
                                    </div>
                                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                                        <div
                                            className="h-full rounded-full transition-all duration-700 ease-out"
                                            style={{
                                                width: `${pct}%`,
                                                backgroundColor:
                                                    STATUS_FILL[d.status] ??
                                                    "var(--chart-7)",
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export function SetoranShiftChart({ data }: { data: ShiftBreakdown[] }) {
    const total = data.reduce((s, d) => s + d.amount, 0);
    const count = data.reduce((s, d) => s + d.count, 0);
    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle>Approved Setoran</CardTitle>
                <CardDescription>
                    {count} setoran{count !== 1 ? "s" : ""} ·{" "}
                    {formatCurrency(total)} total
                </CardDescription>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <EmptyChart />
                ) : (
                    <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                            <p className="text-3xl font-bold">
                                {formatCurrency(total)}
                            </p>
                            <p className="text-muted-foreground mt-1 text-sm">
                                Total approved setoran amount
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export function TopItemsChart({ data }: { data: TopItemRow[] }) {
    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle>Top Selling Items</CardTitle>
                <CardDescription>Most ordered by quantity</CardDescription>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <EmptyChart />
                ) : (
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} layout="vertical">
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    className="stroke-border/50"
                                />
                                <XAxis
                                    type="number"
                                    tick={{
                                        fontSize: 12,
                                        fill: "var(--muted-foreground)",
                                    }}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    tick={{
                                        fontSize: 11,
                                        fill: "var(--muted-foreground)",
                                    }}
                                    width={100}
                                />
                                <Tooltip content={<ChartTooltip />} />
                                <Bar
                                    dataKey="qty"
                                    radius={[0, 4, 4, 0]}
                                    maxBarSize={20}>
                                    {data.map((d, i) => (
                                        <Cell
                                            key={d.name}
                                            fill="var(--chart-1)"
                                            fillOpacity={1 - i * 0.1}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

const TIER_FILL: Record<string, string> = {
    platinum: "var(--chart-3)",
    gold: "var(--chart-1)",
    silver: "var(--chart-6)",
    bronze: "var(--chart-5)",
};

export function CustomerTierChart({ data }: { data: CustomerTierItem[] }) {
    const total = data.reduce((s, d) => s + d.count, 0);
    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle>Customer Tiers</CardTitle>
                <CardDescription>{total} customers</CardDescription>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <EmptyChart />
                ) : (
                    <div className="flex h-64 items-center gap-4">
                        <div className="relative h-48 w-48 shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={44}
                                        outerRadius={74}
                                        dataKey="count"
                                        nameKey="tier"
                                        paddingAngle={2}
                                        strokeWidth={0}>
                                        {data.map((d) => (
                                            <Cell
                                                key={d.tier}
                                                fill={
                                                    TIER_FILL[d.tier] ??
                                                    "var(--chart-7)"
                                                }
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<ChartTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-lg font-bold tabular-nums">
                                    {total.toLocaleString("id-ID")}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    Total
                                </span>
                            </div>
                        </div>
                        <div className="space-y-2 text-sm">
                            {data.map((d) => (
                                <div
                                    key={d.tier}
                                    className="flex items-center gap-2">
                                    <span
                                        className="h-3 w-3 shrink-0 rounded-full"
                                        style={{
                                            backgroundColor:
                                                TIER_FILL[d.tier] ??
                                                "var(--chart-7)",
                                        }}
                                    />
                                    <span className="font-medium">
                                        {formatLabel(d.tier)}
                                    </span>
                                    <span className="ml-auto tabular-nums text-muted-foreground">
                                        {d.count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export function CategoryRadarChart({ data }: { data: CategoryPerformance[] }) {
    let maxQty = 0;
    let maxRev = 0;
    for (const d of data) {
        if (d.qty > maxQty) maxQty = d.qty;
        if (d.revenue > maxRev) maxRev = d.revenue;
    }
    const radarData = data.map((d) => ({
        category: d.category,
        qty: Math.round((d.qty / (maxQty || 1)) * 100),
        revenue: Math.round((d.revenue / (maxRev || 1)) * 100),
    }));

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle>Category Performance</CardTitle>
                <CardDescription>
                    Qty sold vs revenue by menu category
                </CardDescription>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <EmptyChart />
                ) : (
                    <>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={radarData}>
                                    <PolarGrid className="stroke-border/50" />
                                    <PolarAngleAxis
                                        dataKey="category"
                                        tick={{
                                            fontSize: 11,
                                            fill: "var(--muted-foreground)",
                                        }}
                                    />
                                    <PolarRadiusAxis
                                        tick={false}
                                        axisLine={false}
                                    />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Radar
                                        name="Quantity"
                                        dataKey="qty"
                                        stroke="var(--chart-1)"
                                        fill="var(--chart-1)"
                                        fillOpacity={0.2}
                                        strokeWidth={2}
                                        dot={{ r: 3, fill: "var(--chart-1)" }}
                                        activeDot={{ r: 5 }}
                                    />
                                    <Radar
                                        name="Revenue"
                                        dataKey="revenue"
                                        stroke="var(--chart-3)"
                                        fill="var(--chart-3)"
                                        fillOpacity={0.2}
                                        strokeWidth={2}
                                        dot={{ r: 3, fill: "var(--chart-3)" }}
                                        activeDot={{ r: 5 }}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-2 flex justify-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <span className="h-2.5 w-2.5 rounded-full bg-chart-1" />{" "}
                                Quantity
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="h-2.5 w-2.5 rounded-full bg-chart-3" />{" "}
                                Revenue
                            </span>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

interface ChartTooltipProps {
    active?: boolean;
    payload?: Array<{ color?: string; name?: string; value?: string | number }>;
    label?: string;
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-lg border bg-card px-3 py-2 shadow-sm text-sm">
            {label && (
                <p className="mb-1 font-medium text-foreground">{label}</p>
            )}
            <div className="space-y-1">
                {payload.map((entry, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                        <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-muted-foreground">
                            {entry.name}
                        </span>
                        <span className="ml-auto font-medium tabular-nums">
                            {typeof entry.value === "number"
                                ? entry.value.toLocaleString("id-ID")
                                : entry.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function EmptyChart() {
    return (
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            No data available
        </div>
    );
}
