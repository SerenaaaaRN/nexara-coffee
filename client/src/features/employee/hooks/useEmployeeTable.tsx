import {
    createColumnHelper,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { Edit, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { EmployeeRow } from "@/features/employee/types";
import type { TableState } from "@/hooks/useTableState";
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
 * Tabel employee mode server-driven: search/sort/filter/page di-resolve di
 * server. `tableState` dibuat di komponen via `useTableState`; opsi
 * filter branch berasal dari endpoint branches server.
 */
export const useEmployeeTable = (
    employees: EmployeeRow[],
    options: {
        tableState: TableState;
        pageCount: number;
        branchOptions: { id: string; name: string }[];
        callbacks: {
            onEdit: (employee: EmployeeRow) => void;
            onDelete: (employee: EmployeeRow) => void;
        };
    },
) => {
    const { tableState, pageCount, branchOptions, callbacks } = options;

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

    /** Kolom: userName, userEmail, branchName, userRole, baseSalary, hireDate, actions. */
    const columns = useMemo(
        () => [
            columnHelper.accessor((row) => row.userName ?? "", {
                id: "user.name",
                header: "Name",
                cell: (info) => (
                    <span className="font-medium">
                        {info.row.original.userName}
                    </span>
                ),
            }),
            columnHelper.accessor((row) => row.userEmail ?? "", {
                id: "user.email",
                header: "Email",
                cell: (info) => (
                    <span className="text-muted-foreground">
                        {info.row.original.userEmail}
                    </span>
                ),
            }),
            columnHelper.accessor((row) => row.branchName ?? "", {
                id: "branchId",
                header: "Branch",
                cell: (info) => (
                    <Badge variant="secondary">
                        {info.row.original.branchName}
                    </Badge>
                ),
            }),
            columnHelper.accessor((row) => row.userRole ?? "", {
                id: "user.role",
                header: "Role",
                cell: (info) => (
                    <Badge>
                        {formatLabel(info.row.original.userRole ?? "")}
                    </Badge>
                ),
            }),
            columnHelper.accessor("baseSalary", {
                header: "Salary",
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
                enableSorting: false,
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
     * Instance useReactTable server-driven: tanpa row model client
     * (tanpa getFiltered/Sorted/PaginationRowModel).
     */
    const table = useReactTable({
        data: employees,
        columns,
        getRowId: (row) => row.id,
        manualSorting: true,
        manualFiltering: true,
        manualPagination: true,
        pageCount,
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
        getCoreRowModel: getCoreRowModel(),
    });

    return {
        table,
        tableState,
        filterConfigs,
        searchPlaceholder: "Search employees...",
    };
};
