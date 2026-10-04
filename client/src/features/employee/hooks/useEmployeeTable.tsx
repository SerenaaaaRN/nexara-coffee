import {
    createColumnHelper,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { Edit, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { EmployeeRow } from "@/features/employee/types";
import { useTableState } from "@/hooks/useTableState";
import { formatCurrency, formatDate, formatLabel } from "@/utils/format";

const columnHelper = createColumnHelper<EmployeeRow>();

const ROLE_OPTIONS = [
    "super_admin",
    "branch_manager",
    "franchise_owner",
    "cashier",
    "barista",
    "visitor",
].map((role) => ({ value: role, label: formatLabel(role) }));

/**
 * Mempersiapkan column definitions, filter configs, useTableState, dan instance useReactTable
 * untuk tabel employee. Callbacks onEdit / onDelete diteruskan ke kolom aksi.
 */
export const useEmployeeTable = (
    employees: EmployeeRow[],
    callbacks: {
        onEdit: (employee: EmployeeRow) => void;
        onDelete: (employee: EmployeeRow) => void;
    },
) => {
    const tableState = useTableState();

    /** Mengumpulkan daftar branch unik dari data employee untuk opsi filter. */
    const branchOptions = useMemo(() => {
        const unique = new Map<string, { id: string; name: string }>();
        for (const e of employees) {
            if (!unique.has(e.branchId)) {
                unique.set(e.branchId, { id: e.branchId, name: e.branch.name });
            }
        }
        return Array.from(unique.values());
    }, [employees]);

    /** Konfigurasi filter untuk kolom role dan branch. */
    const filterConfigs = useMemo(
        () => [
            {
                columnId: "user.role" as const,
                options: ROLE_OPTIONS,
                placeholder: "All roles",
            },
            {
                columnId: "branchId" as const,
                options: branchOptions.map((b) => ({
                    value: b.id,
                    label: b.name,
                })),
                placeholder: "All branches",
            },
        ],
        [branchOptions],
    );

    /** Kolom: user.name, user.email, branchId, user.role, baseSalary, hireDate, actions. */
    const columns = useMemo(
        () => [
            columnHelper.accessor((row) => row.user.name, {
                id: "user.name",
                header: "Name",
                cell: (info) => (
                    <span className="font-medium">
                        {info.row.original.user.name}
                    </span>
                ),
            }),
            columnHelper.accessor((row) => row.user.email, {
                id: "user.email",
                header: "Email",
                cell: (info) => (
                    <span className="text-muted-foreground">
                        {info.row.original.user.email}
                    </span>
                ),
            }),
            columnHelper.accessor((row) => row.branch.name, {
                id: "branchId",
                header: "Branch",
                filterFn: (row, _columnId, filterValue) => {
                    if (!filterValue) return true;
                    return row.original.branchId === filterValue;
                },
                cell: (info) => (
                    <Badge variant="secondary">
                        {info.row.original.branch.name}
                    </Badge>
                ),
            }),
            columnHelper.accessor((row) => row.user.role, {
                id: "user.role",
                header: "Role",
                cell: (info) => (
                    <Badge>{formatLabel(info.row.original.user.role)}</Badge>
                ),
            }),
            columnHelper.accessor("baseSalary", {
                header: "Salary",
                // baseSalary disimpan sebagai string desimal — urutkan secara numerik.
                sortingFn: (a, b, columnId) =>
                    Number(a.getValue(columnId)) - Number(b.getValue(columnId)),
                cell: (info) =>
                    formatCurrency(parseInt(info.row.original.baseSalary, 10)),
            }),
            columnHelper.accessor("hireDate", {
                header: "Hired",
                cell: (info) => formatDate(info.row.original.hireDate),
            }),
            columnHelper.display({
                id: "actions",
                header: "Actions",
                cell: ({ row }) => (
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => callbacks.onEdit(row.original)}>
                            <Edit className="size-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => callbacks.onDelete(row.original)}>
                            <Trash2 className="size-4" />
                        </Button>
                    </div>
                ),
            }),
        ],
        [callbacks.onEdit, callbacks.onDelete],
    );

    /**
     * Instance useReactTable.
     * globalFilterFn mencari berdasarkan user.name, user.email, user.role, branch.name.
     */
    const table = useReactTable({
        data: employees,
        columns,
        getRowId: (row) => row.id,
        state: {
            sorting: tableState.sorting,
            globalFilter: tableState.globalFilter,
            columnFilters: tableState.columnFilters,
            pagination: tableState.pagination,
        },
        onSortingChange: tableState.setSorting,
        onGlobalFilterChange: tableState.setGlobalFilter,
        onColumnFiltersChange: tableState.setColumnFilters,
        onPaginationChange: tableState.setPagination,
        globalFilterFn: (row, _columnId, filterValue) => {
            const q = String(filterValue).toLowerCase();
            const e = row.original;
            return (
                e.user.name.toLowerCase().includes(q) ||
                e.user.email.toLowerCase().includes(q) ||
                e.user.role.toLowerCase().includes(q) ||
                e.branch.name.toLowerCase().includes(q)
            );
        },
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    return {
        table,
        tableState,
        filterConfigs,
        searchPlaceholder: "Search employees...",
    };
};
