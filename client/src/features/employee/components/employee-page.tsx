import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SectionHeader } from "@/components/shared/section-header";
import { EmployeeFormDialog } from "@/features/employee/components/employee-form-dialog";
import { EmployeeTable } from "@/features/employee/components/employee-table";
import { useDeleteEmployee } from "@/features/employee/hooks/useEmployeeMutations";
import {
    useAvailableUsers,
    useEmployeeBranches,
    useEmployees,
} from "@/features/employee/hooks/useEmployeeQueries";
import type { EmployeeRow } from "@/features/employee/types";
import { useConfirmAction } from "@/hooks/useConfirmAction";

export const EmployeePage = () => {
    const { data: employeesData } = useEmployees();
    const { data: usersData } = useAvailableUsers();
    const { data: branchesData } = useEmployeeBranches();

    const deleteMutation = useDeleteEmployee();

    const employees = employeesData?.success ? employeesData.data : [];
    const users = usersData?.success ? usersData.data : [];
    const branches = branchesData?.success ? branchesData.data : [];

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

    const availableUsers = users.filter(
        (u) =>
            !employees.find((e) => e.userId === u.id) ||
            editEmployee?.userId === u.id,
    );

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Employee"
                subtitle="Manage employees and payroll."
            />
            <EmployeeTable
                employees={employees}
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
