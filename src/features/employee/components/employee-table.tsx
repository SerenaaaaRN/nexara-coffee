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
import type { EmployeeRow } from "@/features/employee/types";
import { formatCurrency } from "@/utils/format";

type EmployeeTableProps = {
    employees: EmployeeRow[];
    onEdit: (employee: EmployeeRow) => void;
    onDelete: (employee: EmployeeRow) => void;
    onCreateOpen: (open: boolean) => void;
};

export const EmployeeTable = ({
    employees,
    onEdit,
    onDelete,
    onCreateOpen,
}: EmployeeTableProps) => {
    const { table, tableState, filterConfigs, searchPlaceholder } =
        useEmployeeTable(employees, { onEdit, onDelete });

    const filteredRows = table.getFilteredRowModel().rows;
    const rows = table.getRowModel().rows;
    const filteredCount = filteredRows.length;
    const totalSalary = filteredRows.reduce(
        (sum, r) => sum + parseInt(r.original.baseSalary, 10),
        0,
    );
    const branchCount = new Set(filteredRows.map((r) => r.original.branchId))
        .size;
    const pageIndex = tableState.pagination.pageIndex;
    const pageCount = table.getPageCount();

    return (
        <div className="flex flex-col gap-4">
            {employees.length === 0 ? (
                <>
                    <div className="flex justify-end">
                        <Button
                            data-tour="employee-add"
                            onClick={() => onCreateOpen(true)}>
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
                        <div
                            data-tour="employee-stats"
                            className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4">
                            <StatCard label="Total" value={filteredCount} />
                            <StatCard label="Branches" value={branchCount} />
                            <StatCard
                                label="Total Salary"
                                value={formatCurrency(totalSalary)}
                            />
                        </div>
                        <Button
                            data-tour="employee-add"
                            onClick={() => onCreateOpen(true)}>
                            <Plus className="size-4" /> Add Employee
                        </Button>
                    </div>
                    <div data-tour="employee-toolbar">
                        <FilterToolbar
                            tableState={tableState}
                            searchPlaceholder={searchPlaceholder}
                            filters={filterConfigs}
                            total={employees.length}
                            filtered={filteredCount}
                        />
                    </div>
                    <Table>
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
                                            <div className="flex items-center gap-1">
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
                            {rows.map((row) => (
                                <TableRow key={row.id}>
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
                    </Table>
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Showing {filteredCount} employee
                            {filteredCount !== 1 ? "s" : ""}
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
        </div>
    );
};
