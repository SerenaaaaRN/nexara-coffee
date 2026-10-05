import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { ExpectedCash } from "@/features/kasir/types";
import { formatCurrency } from "@/utils/format";

interface PosSummaryProps {
    data: ExpectedCash | undefined;
    declaredAmount: number;
    isLoading: boolean;
}

function Row({ label, value }: { label: string; value: number }) {
    return (
        <div className="flex justify-between">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-mono tabular-nums">
                {formatCurrency(value)}
            </span>
        </div>
    );
}

export const KasirPosSummary = ({
    data,
    declaredAmount,
    isLoading,
}: PosSummaryProps) => {
    if (isLoading) {
        return (
            <div className="rounded-lg border bg-muted/50 p-3 text-sm">
                <Skeleton className="h-4 w-40" />
                <div className="mt-2 space-y-1.5">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-3/4" />
                </div>
                <Skeleton className="mt-3 h-3 w-1/2" />
            </div>
        );
    }

    if (!data) return null;

    const diff = declaredAmount - data.cashTotal;
    const isExact = diff === 0;
    const isSurplus = diff > 0;

    const diffColor = isExact
        ? "text-green-600"
        : isSurplus
          ? "text-yellow-600"
          : "text-red-600";
    const diffLabel = isExact
        ? "Difference"
        : isSurplus
          ? "Surplus"
          : "Shortage";

    return (
        <div className="rounded-lg border bg-muted/50 p-3 text-sm">
            <p className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wider">
                POS Transactions (today)
            </p>

            <div className="space-y-1">
                <Row label="Total" value={data.total} />
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Cash</span>
                    <span className="font-mono tabular-nums">
                        {data.cashTotal === 0
                            ? "Rp 0 (no cash transactions)"
                            : formatCurrency(data.cashTotal)}
                    </span>
                </div>
                <Row label="QRIS" value={data.qrisTotal} />
                <Row label="Debit" value={data.debitTotal} />
                <Row label="Credit" value={data.creditTotal} />
            </div>

            <Separator className="my-2" />

            <div className="space-y-1">
                <Row label="Declared" value={declaredAmount} />
                <div className="flex justify-between">
                    <span className="text-muted-foreground">{diffLabel}</span>
                    <span className={`font-mono tabular-nums ${diffColor}`}>
                        {formatCurrency(Math.abs(diff))}
                    </span>
                </div>
            </div>
        </div>
    );
};
