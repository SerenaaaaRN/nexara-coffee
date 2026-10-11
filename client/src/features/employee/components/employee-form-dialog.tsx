import { useEffect } from "react";
import { Controller } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { CurrencyInput } from "@/components/shared/currency-input";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Field,
    FieldContent,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    useCreateEmployee,
    useUpdateEmployee,
} from "@/features/employee/hooks/useEmployeeMutations";
import {
    createEmployeeSchema,
    type EmployeeRow,
} from "@/features/employee/types";
import { useFormDialog } from "@/hooks/useFormDialog";
import { useBranchStore } from "@/stores/branch";
import { formatLabel } from "@/utils/format";

type FormValues = z.infer<typeof createEmployeeSchema>;

type EmployeeFormDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employee?: EmployeeRow;
    onSuccess: () => void;
    users: { id: string; name: string; email: string; role: string }[];
    branches: { id: string; name: string }[];
};

export const EmployeeFormDialog = ({
    open,
    onOpenChange,
    employee,
    onSuccess,
    users,
    branches,
}: EmployeeFormDialogProps) => {
    const activeBranch = useBranchStore((s) => s.activeBranch);
    const createMutation = useCreateEmployee();
    const updateMutation = useUpdateEmployee();

    const { form, resetForm } = useFormDialog(createEmployeeSchema, {
        userId: "",
        branchId: activeBranch ?? "",
        baseSalary: "",
        hireDate: "",
    });

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
        watch,
    } = form;

    const branchDisabled = !!activeBranch;
    const branchList = activeBranch
        ? branches.filter((b) => b.id === activeBranch)
        : branches;

    useEffect(() => {
        if (open) {
            if (employee) {
                resetForm({
                    userId: employee.userId,
                    branchId: employee.branchId,
                    baseSalary: employee.baseSalary,
                    hireDate: employee.hireDate,
                });
            } else {
                resetForm();
            }
        }
    }, [open, employee, resetForm]);

    const onSubmit = async (values: FormValues) => {
        const res = employee
            ? await updateMutation
                  .mutateAsync({ id: employee.id, ...values })
                  .catch(() => null)
            : await createMutation.mutateAsync(values).catch(() => null);
        if (!res) return;
        if (res.success) {
            toast.success(employee ? "Employee updated" : "Employee created");
            onSuccess();
        } else {
            toast.error(
                typeof res.error === "string"
                    ? res.error
                    : "Failed to save employee",
            );
        }
    };

    const selectedUser = users.find((u) => u.id === watch("userId"));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {employee ? "Edit Employee" : "Add Employee"}
                    </DialogTitle>
                    <DialogDescription>
                        {employee
                            ? "Update existing employee data"
                            : "Assign a user to a branch"}
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="flex flex-col gap-4">
                    <FieldGroup>
                        <Field data-invalid={!!errors.userId}>
                            <FieldLabel>User</FieldLabel>
                            <FieldContent>
                                <Controller
                                    control={control}
                                    name="userId"
                                    render={({ field, fieldState }) => (
                                        <Select
                                            value={field.value}
                                            onValueChange={(v) =>
                                                field.onChange(v ?? "")
                                            }
                                            disabled={!!employee}
                                            items={Object.fromEntries(
                                                users.map((u) => [
                                                    u.id,
                                                    `${u.name} — ${formatLabel(u.role)}`,
                                                ]),
                                            )}>
                                            <SelectTrigger
                                                className="w-full"
                                                aria-invalid={
                                                    !!fieldState.error
                                                }>
                                                <SelectValue placeholder="Select user" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    {users.map((u) => (
                                                        <SelectItem
                                                            key={u.id}
                                                            value={u.id}>
                                                            {u.name} —{" "}
                                                            {formatLabel(
                                                                u.role,
                                                            )}
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {selectedUser ? (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Role: {formatLabel(selectedUser.role)}
                                    </p>
                                ) : null}
                            </FieldContent>
                        </Field>

                        <Field data-invalid={!!errors.branchId}>
                            <FieldLabel>Branch</FieldLabel>
                            <FieldContent>
                                <Controller
                                    control={control}
                                    name="branchId"
                                    render={({ field, fieldState }) => (
                                        <Select
                                            value={field.value}
                                            onValueChange={(v) =>
                                                field.onChange(v ?? "")
                                            }
                                            disabled={branchDisabled}
                                            items={Object.fromEntries(
                                                branchList.map((b) => [
                                                    b.id,
                                                    b.name,
                                                ]),
                                            )}>
                                            <SelectTrigger
                                                className="w-full"
                                                aria-invalid={
                                                    !!fieldState.error
                                                }>
                                                <SelectValue
                                                    placeholder={
                                                        branchDisabled &&
                                                        !activeBranch
                                                            ? "Loading..."
                                                            : "Select branch"
                                                    }
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    {branchList.map((b) => (
                                                        <SelectItem
                                                            key={b.id}
                                                            value={b.id}>
                                                            {b.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </FieldContent>
                        </Field>

                        <div className="grid grid-cols-2 gap-4">
                            <Field data-invalid={!!errors.baseSalary}>
                                <FieldLabel>Base Salary</FieldLabel>
                                <FieldContent>
                                    <Controller
                                        control={control}
                                        name="baseSalary"
                                        render={({ field }) => (
                                            <CurrencyInput
                                                id="baseSalary"
                                                placeholder="Rp "
                                                aria-invalid={
                                                    !!errors.baseSalary
                                                }
                                                value={Number(field.value) || 0}
                                                onChange={(val: number) =>
                                                    field.onChange(String(val))
                                                }
                                            />
                                        )}
                                    />
                                    <FieldError errors={[errors.baseSalary]} />
                                </FieldContent>
                            </Field>

                            <Field data-invalid={!!errors.hireDate}>
                                <FieldLabel>Hire Date</FieldLabel>
                                <FieldContent>
                                    <Input
                                        type="date"
                                        aria-invalid={!!errors.hireDate}
                                        {...register("hireDate")}
                                    />
                                    <FieldError errors={[errors.hireDate]} />
                                </FieldContent>
                            </Field>
                        </div>
                    </FieldGroup>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {employee ? "Save" : "Add"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
