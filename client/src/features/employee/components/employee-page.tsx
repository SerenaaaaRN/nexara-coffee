import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SectionHeader } from "@/components/shared/section-header";
import { EmployeeFormDialog } from "@/features/employee/components/employee-form-dialog";
import { EmployeeTable } from "@/features/employee/components/employee-table";
import { useDeleteEmployee } from "@/features/employee/hooks/useEmployeeMutations";
import {
    useAvailableUsers,
    useEmployeeBranches,
    useEmployeesTableQuery,
} from "@/features/employee/hooks/useEmployeeQueries";
import type { EmployeeFilters } from "@/features/employee/hooks/useEmployeeQueries";
import type { EmployeeRow } from "@/features/employee/types";
import { useConfirmAction } from "@/hooks/useConfirmAction";
import { useTableState } from "@/hooks/useTableState";

export const EmployeePage = () => {
    const tableState = useTableState();
    const { data: usersData } = useAvailableUsers();
    const { data: branchesData } = useEmployeeBranches();

    const deleteMutation = useDeleteEmployee();

    const users = usersData?.success ? usersData.data : [];
    const branches = branchesData?.success ? branchesData.data : [];

    const role = tableState.getFilterValue("user.role");
    const branchId = tableState.getFilterValue("branchId");

    const queryParams = useMemo(() => {
        const params: EmployeeFilters = {
            role,
            branchId,
            pageSize: tableState.pagination.pageSize,
        };
        const q = tableState.debouncedSearch.trim();
        if (q) params.q = q;
        if (tableState.pagination.pageIndex > 0) {
            params.page = tableState.pagination.pageIndex;
        }
        if (tableState.sortBy) {
            params.sortBy = tableState.sortBy;
            params.sortDir = tableState.sortDir ?? "desc";
        }
        return params;
    }, [
        role,
        branchId,
        tableState.debouncedSearch,
        tableState.pagination.pageIndex,
        tableState.pagination.pageSize,
        tableState.sortBy,
        tableState.sortDir,
    ]);

    const { data: response, isPending } = useEmployeesTableQuery(queryParams);

    const payload = response?.success ? response.data : null;
    const rows = payload?.rows ?? [];
    const total = payload?.total ?? 0;
    const summary = payload?.summary ?? {
        total: 0,
        branchCount: 0,
        totalSalary: "0",
    };
    const loadError = response && !response.success ? response.error : null;

    const hasActiveFilter =
        tableState.debouncedSearch.trim() !== "" ||
        role !== undefined ||
        branchId !== undefined;

    const pageCount = Math.max(
        1,
        Math.ceil(total / tableState.pagination.pageSize),
    );

    const [editEmployee, setEditEmployee] = useState<EmployeeRow | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const {
        target: deleteTarget,
        setTarget: setDeleteTarget,
        dialogProps,
    } = useConfirmAction<{ id: string; name: string }>();

    const handleDelete = async () => {
        if (!deleteTarget) return;
        const res = await deleteMutation
            .mutateAsync(deleteTarget.id)
            .catch(() => null);
        if (!res) return;
        if (res.success) {
            toast.success("Employee removed");
        } else {
            toast.error("Failed to remove employee");
        }
    };

    const handleFormSuccess = () => {
        setEditEmployee(null);
        setCreateOpen(false);
    };

    const availableUsers = useMemo(() => {
        if (!editEmployee) return users;
        if (users.some((u) => u.id === editEmployee.userId)) return users;
        const { userId, userName, userEmail, userRole } = editEmployee;
        if (userName == null || userEmail == null || userRole == null) {
            return users;
        }
        return [
            ...users,
            { id: userId, name: userName, email: userEmail, role: userRole },
        ];
    }, [users, editEmployee]);

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Employee"
                subtitle="Manage employees and payroll."
            />
            <EmployeeTable
                rows={rows}
                total={total}
                summary={summary}
                tableState={tableState}
                pageCount={pageCount}
                branchOptions={branches}
                hasActiveFilter={hasActiveFilter}
                loadError={loadError}
                isLoading={isPending && !payload && !loadError}
                onEdit={setEditEmployee}
                onDelete={(e) =>
                    setDeleteTarget({ id: e.id, name: e.userName ?? e.userId })
                }
                onCreateOpen={setCreateOpen}
            />
            <EmployeeFormDialog
                open={!!editEmployee || createOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setEditEmployee(null);
                        setCreateOpen(false);
                    }
                }}
                employee={editEmployee ?? undefined}
                onSuccess={handleFormSuccess}
                users={availableUsers}
                branches={branches}
            />
            <ConfirmDialog
                {...dialogProps}
                onConfirm={handleDelete}
                title="Remove employee?"
                description={
                    <>
                        Are you sure you want to remove{" "}
                        <strong>{deleteTarget?.name}</strong>? This action
                        cannot be undone.
                    </>
                }
                confirmLabel="Remove"
            />
        </div>
    );
};
