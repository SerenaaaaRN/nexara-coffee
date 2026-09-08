import { Coffee } from "lucide-react";
import { SectionHeader } from "@/components/shared/section-header";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import {
    Empty,
    EmptyDescription,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useMyOrders } from "@/features/customer-portal/hooks/useCustomerPortalQueries";
import { formatCurrency, formatDateTime } from "@/utils/format";
import { getBadgeVariant, getStatusLabel } from "@/utils/status";

export function MyOrdersPage() {
    const { data: response } = useMyOrders();

    if (!response.success) throw new Error(response.error);
    const orders = response.data;

    const completed = orders.filter((o) => o.status === "completed").length;

    if (orders.length === 0) {
        return (
            <div className="space-y-6">
                <SectionHeader
                    title="Pesananku"
                    subtitle="Riwayat pesanan kamu di Nexara Coffee."
                />
                <Empty>
                    <EmptyMedia variant="icon">
                        <Coffee />
                    </EmptyMedia>
                    <EmptyTitle>Belum ada pesanan</EmptyTitle>
                    <EmptyDescription>
                        Pesanan kamu akan muncul di sini setelah memesan di
                        cabang Nexara Coffee.
                    </EmptyDescription>
                </Empty>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Pesananku"
                subtitle="Riwayat pesanan kamu di Nexara Coffee."
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <StatCard
                    label="Total Pesanan"
                    value={orders.length}
                    icon={Coffee}
                />
                <StatCard
                    label="Selesai"
                    value={completed}
                    icon={Coffee}
                />
            </div>
            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>No. Order</TableHead>
                            <TableHead>Cabang</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Tanggal</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.map((o) => (
                            <TableRow key={o.id}>
                                <TableCell className="font-medium tabular-nums">
                                    {o.orderNumber}
                                </TableCell>
                                <TableCell>
                                    {o.branchName ?? "-"}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={getBadgeVariant(o.status)}>
                                        {getStatusLabel(o.status)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                    {formatCurrency(o.totalAmount)}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                    {formatDateTime(o.createdAt)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
