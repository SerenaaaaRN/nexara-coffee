import { flexRender, type Table } from "@tanstack/react-table";
import {
    ArrowDown,
    ArrowUp,
    ChevronLeft,
    ChevronRight,
    ChevronsUpDown,
    CircleDollarSign,
    Plus,
} from "lucide-react";
import { lazy, Suspense } from "react";
import { FilterToolbar } from "@/components/shared/filter-toolbar";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import {
    Empty,
    EmptyDescription,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Table as UITable,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SetoranRow, SetoranSummary } from "@/features/kasir/types";
import { formatCurrency } from "@/utils/format";

const KasirBoard = lazy(() =>
    import("@/features/kasir/components/kasir-board").then((m) => ({
        default: m.KasirBoard,
    })),
);

interface TableState {
    globalFilter: string;
    setGlobalFilter: (value: string) => void;
    getFilterValue: (columnId: string) => string | undefined;
    setFilterValue: (
        columnId: string,
        value: string | undefined | null,
    ) => void;
    clearAll: () => void;
    pagination: { pageIndex: number; pageSize: number };
}

interface FilterConfig {
    columnId: string;
    options: { value: string; label: string }[];
    placeholder?: string;
    width?: string;
}

interface Props {
    table: Table<SetoranRow>;
    tableState: TableState;
    filterConfigs: FilterConfig[];
    searchPlaceholder: string;
    view: "table" | "board";
    onViewChange: (v: "table" | "board") => void;
    onRecord: () => void;
    canRecord: boolean;
    onRowClick: (row: SetoranRow) => void;
    canApprove: boolean;
    total: number;
    summary: SetoranSummary;
}

export const KasirTable = ({
    table,
    tableState,
    filterConfigs,
    searchPlaceholder,
    view,
    onViewChange,
    onRecord,
    canRecord,
    onRowClick,
    canApprove,
    total,
    summary,
}: Props) => {
    const rows = table.getRowModel().rows;
    const pageIndex = tableState.pagination.pageIndex;
    const pageCount = table.getPageCount();

    return (
        <>
            <div className="flex items-start justify-between gap-4">
                <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4">
                    <StatCard
                        label="Total Setoran"
                        value={formatCurrency(summary.totalAmount)}
                    />
                    <StatCard label="Approved" value={summary.approved} />
                    <StatCard label="Pending" value={summary.pending} />
                    <StatCard label="Total Entries" value={summary.total} />
                </div>
                <Button onClick={onRecord} disabled={!canRecord}>
                    <Plus data-icon="inline-start" /> Record Setoran
                </Button>
            </div>

            <FilterToolbar
                tableState={tableState}
                searchPlaceholder={searchPlaceholder}
                filters={filterConfigs}
                total={total}
                filtered={rows.length}>
                <Tabs
                    value={view}
                    onValueChange={(v) => onViewChange(v as "table" | "board")}>
                    <TabsList>
                        <TabsTrigger value="table">Table</TabsTrigger>
                        <TabsTrigger value="board">Board</TabsTrigger>
                    </TabsList>
                </Tabs>
            </FilterToolbar>

            {rows.length === 0 ? (
                <Empty>
                    <EmptyMedia variant="icon">
                        <CircleDollarSign />
                    </EmptyMedia>
                    <EmptyTitle>No matching setorans</EmptyTitle>
                    <EmptyDescription>
                        Try adjusting your search or filters.
                    </EmptyDescription>
                </Empty>
            ) : view === "table" ? (
                <div className="flex flex-col gap-4">
                    <UITable>
                        <TableHeader>
                            {table.getHeaderGroups().map((hg) => (
                                <TableRow key={hg.id}>
                                    {hg.headers.map((h) => (
                                        <TableHead
                                            key={h.id}
                                            onClick={h.column.getToggleSortingHandler()}
                                            aria-sort={
                                                h.column.getIsSorted() === "asc"
                                                    ? "ascending"
                                                    : h.column.getIsSorted() ===
                                                        "desc"
                                                      ? "descending"
                                                      : undefined
                                            }>
                                            <div className="flex items-center gap-1 cursor-pointer select-none hover:text-foreground">
                                                {h.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                          h.column.columnDef
                                                              .header,
                                                          h.getContext(),
                                                      )}
                                                {h.column.getCanSort() ? (
                                                    h.column.getIsSorted() ===
                                                    "asc" ? (
                                                        <ArrowUp className="size-3" />
                                                    ) : h.column.getIsSorted() ===
                                                      "desc" ? (
                                                        <ArrowDown className="size-3" />
                                                    ) : (
                                                        <ChevronsUpDown className="size-3 text-muted-foreground opacity-50" />
                                                    )
                                                ) : null}
                                            </div>
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    className="cursor-pointer"
                                    onClick={() => onRowClick(row.original)}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext(),
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </UITable>
                    <div className="flex items-center justify-between mt-2">
                        <p className="text-sm text-muted-foreground">
                            Showing {rows.length} of {total} setoran
                            {total !== 1 ? "s" : ""}
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}>
                                <ChevronLeft className="size-4" />
                            </Button>
                            <span className="text-sm text-muted-foreground tabular-nums">
                                {pageIndex + 1} / {pageCount}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}>
                                <ChevronRight className="size-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <Suspense
                    fallback={
                        <div className="grid grid-cols-3 gap-4">
                            <Skeleton className="h-64 w-full" />
                            <Skeleton className="h-64 w-full" />
                            <Skeleton className="h-64 w-full" />
                        </div>
                    }>
                    <KasirBoard
                        setorans={rows.map((r) => r.original)}
                        canApprove={canApprove}
                        onSelectSetoran={onRowClick}
                    />
                </Suspense>
            )}
        </>
    );
};
