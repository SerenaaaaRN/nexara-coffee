import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type {
    BranchRankingRow,
    RecentOrderRow,
} from "@/features/overview/types";
import { formatCurrency, formatDate, formatLabel } from "@/utils/format";
import { getBadgeVariant } from "@/utils/status";

export function RecentOrdersTable({ data }: { data: RecentOrderRow[] }) {
    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>
                    Latest {data.length} orders across all branches
                </CardDescription>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                        No recent orders
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order #</TableHead>
                                <TableHead>Branch</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium">
                                        {order.orderNumber}
                                    </TableCell>
                                    <TableCell>{order.branchName}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={getBadgeVariant(
                                                order.status,
                                            )}>
                                            {formatLabel(order.status)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {formatCurrency(
                                            Number(order.totalAmount),
                                        )}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {formatDate(order.createdAt, {
                                            day: "numeric",
                                            month: "short",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}

export function BranchRankingTable({ data }: { data: BranchRankingRow[] }) {
    let maxRevenue = 0;
    for (const d of data) {
        if (d.revenue > maxRevenue) maxRevenue = d.revenue;
    }
    if (maxRevenue === 0) maxRevenue = 1;
    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle>Branch Performance Ranking</CardTitle>
                <CardDescription>
                    Revenue ranking across branches
                </CardDescription>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                        No data
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-10">#</TableHead>
                                <TableHead>Branch</TableHead>
                                <TableHead>Revenue</TableHead>
                                <TableHead>Setorans</TableHead>
                                <TableHead>Progress</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((row, i) => {
                                const pct = Math.round(
                                    (row.revenue / maxRevenue) * 100,
                                );
                                return (
                                    <TableRow key={row.branchId}>
                                        <TableCell className="text-center font-bold text-muted-foreground">
                                            {i + 1}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {row.branch}
                                        </TableCell>
                                        <TableCell>
                                            {formatCurrency(row.revenue)}
                                        </TableCell>
                                        <TableCell>
                                            {row.setoranCount}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="h-5 flex-1 overflow-hidden rounded-full bg-muted">
                                                    <div
                                                        className="h-full rounded-full bg-primary"
                                                        style={{
                                                            width: `${pct}%`,
                                                        }}
                                                    />
                                                </div>
                                                <span className="w-10 text-right text-xs font-medium tabular-nums text-muted-foreground">
                                                    {pct}%
                                                </span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
