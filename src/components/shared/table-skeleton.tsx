import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/utils/cn";

const DEFAULT_WIDTHS = [
    "w-full max-w-32",
    "w-full max-w-48",
    "w-full max-w-20",
    "w-full max-w-24",
    "w-full max-w-28",
    "w-full max-w-36",
];

interface TableSkeletonProps {
    columns: number;
    rows?: number;
    columnWidths?: string[];
    headers?: string[];
}

export function TableSkeleton({
    columns,
    rows = 5,
    columnWidths,
    headers,
}: TableSkeletonProps) {
    return (
        <Table>
            {headers && (
                <TableHeader>
                    <TableRow>
                        {headers.map((h, i) => (
                            <TableHead key={i}>{h}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
            )}
            <TableBody>
                {Array.from({ length: rows }).map((_, r) => (
                    <TableRow key={r}>
                        {Array.from({ length: columns }).map((_, c) => (
                            <TableCell key={c}>
                                <Skeleton
                                    className={cn(
                                        "h-7",
                                        columnWidths?.[c] ??
                                            DEFAULT_WIDTHS[
                                                c % DEFAULT_WIDTHS.length
                                            ],
                                    )}
                                />
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
