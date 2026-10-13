import { flexRender } from "@tanstack/react-table";
import {
    ArrowDown,
    ArrowUp,
    ChevronLeft,
    ChevronRight,
    ChevronsUpDown,
    Plus,
    Users,
} from "lucide-react";
import { EmployeeSkeleton } from "@/components/fallbacks/dashboard";
import { FilterToolbar } from "@/components/shared/filter-toolbar";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
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
import { useEmployeeTable } from "@/features/employee/hooks/useEmployeeTable";
import type { EmployeeRow, EmployeeSummary } from "@/features/employee/types";
import type { TableState } from "@/hooks/useTableState";
import { formatCurrency } from "@/utils/format";

type EmployeeTableProps = {
    rows: EmployeeRow[];
    total: number;
    summary: EmployeeSummary;
    tableState: TableState;
    pageCount: number;
    branchOptions: { id: string; name: string }[];
    hasActiveFilter: boolean;
    loadError: string | null;
    isLoading: boolean;
    onEdit: (employee: EmployeeRow) => void;
    onDelete: (employee: EmployeeRow) => void;
    onCreateOpen: (open: boolean) => void;
};

export const EmployeeTable = ({
    rows,
    total,
    summary,
    tableState,
    pageCount,
    branchOptions,
    hasActiveFilter,
    loadError,
    isLoading,
    onEdit,
    onDelete,
    onCreateOpen,
}: EmployeeTableProps) => {
    const { table, filterConfigs, searchPlaceholder } = useEmployeeTable(rows, {
        tableState,
        pageCount,
        branchOptions,
        callbacks: { onEdit, onDelete },
    });

    const tableRows = table.getRowModel().rows;
    const pageIndex = tableState.pagination.pageIndex;

    if (isLoading) {
        return <EmployeeSkeleton />;
    }

    if (loadError) {
        return (
            <Empty>
                <EmptyMedia variant="icon">
                    <Users />
                </EmptyMedia>
                <EmptyTitle>Failed to load employees</EmptyTitle>
                <EmptyDescription>{loadError}</EmptyDescription>
            </Empty>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {total === 0 && !hasActiveFilter ? (
                <>
                    <div className="flex justify-end">
                        <Button onClick={() => onCreateOpen(true)}>
                            <Plus className="me-2" /> Add Employee
                        </Button>
                    </div>
                    <Empty>
                        <EmptyMedia variant="icon">
                            <Users />
                        </EmptyMedia>
                        <EmptyTitle>No employees yet</EmptyTitle>
                        <EmptyDescription>
                            Assign a user to a branch to get started.
                        </EmptyDescription>
                    </Empty>
                </>
            ) : (
                <>
                    <div className="flex items-start justify-between gap-4">
                        <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4">
                            <StatCard label="Total" value={summary.total} />
                            <StatCard
                                label="Branches"
                                value={summary.branchCount}
                            />
                            <StatCard
                                label="Total Salary"
                                value={formatCurrency(summary.totalSalary)}
                            />
                        </div>
                        <Button onClick={() => onCreateOpen(true)}>
                            <Plus className="size-4" /> Add Employee
                        </Button>
                    </div>
                    <FilterToolbar
                        tableState={tableState}
                        searchPlaceholder={searchPlaceholder}
                        filters={filterConfigs}
                        total={total}
                        filtered={rows.length}
                    />
                    {rows.length === 0 ? (
                        <Empty>
                            <EmptyMedia variant="icon">
                                <Users />
                            </EmptyMedia>
                            <EmptyTitle>No matching employees</EmptyTitle>
                            <EmptyDescription>
                                Try adjusting your search or filters.
                            </EmptyDescription>
                        </Empty>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    {table.getHeaderGroups().map((hg) => (
                                        <TableRow key={hg.id}>
                                            {hg.headers.map((h) => (
                                                <TableHead
                                                    key={h.id}
                                                    onClick={h.column.getToggleSortingHandler()}
                                                    aria-sort={
                                                        h.column.getIsSorted() ===
                                                        "asc"
                                                            ? "ascending"
                                                            : h.column.getIsSorted() ===
                                                                "desc"
                                                              ? "descending"
                                                              : undefined
                                                    }>
                                                    <div className="flex items-center gap-1">
                                                        {h.isPlaceholder
                                                            ? null
                                                            : flexRender(
                                                                  h.column
                                                                      .columnDef
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
                                                                <ChevronsUpDown className="size-3 text-muted-foreground" />
                                                            )
                                                        ) : null}
                                                    </div>
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableHeader>
                                <TableBody>
                                    {tableRows.map((row) => (
                                        <TableRow key={row.id}>
                                            {row
                                                .getVisibleCells()
                                                .map((cell) => (
                                                    <TableCell key={cell.id}>
                                                        {flexRender(
                                                            cell.column
                                                                .columnDef.cell,
                                                            cell.getContext(),
                                                        )}
                                                    </TableCell>
                                                ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                    Showing {rows.length} of {total} employee
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
                        </>
                    )}
                </>
            )}
        </div>
    );
};
