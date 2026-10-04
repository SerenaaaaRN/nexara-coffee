import type { Database } from "@database/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type {
    CreateEmployeeInput,
    Employee,
    UpdateEmployeeInput,
} from "@/features/employee/types";
import {
    createEmployeeSchema,
    updateEmployeeSchema,
} from "@/features/employee/types";
import { employeeKeys } from "@/features/query-keys";

/**
 * Menambahkan employee baru (mengaitkan user ke branch).
 *
 * Memvalidasi tidak ada duplikasi user per branch (setiap user hanya bisa
 * menjadi employee di satu branch). Mencatat audit log setelah berhasil.
 *
 * @returns Data employee yang baru dibuat
 */
export const createEmployeeFn = createServerFn({ method: "POST" })
    .validator(createEmployeeSchema)
    .handler(async ({ data }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("create", "employee");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { rateLimit } = await import("@/lib/rate-limit");
        if (!rateLimit(`employee:create:${auth.session.user.id}`, 20, 60_000)) {
            return { success: false as const, error: "Too many requests" };
        }

        const { supabaseAdmin } = await import("@database/server");
        const { logAudit } = await import("@/lib/audit-log");

        type EmployeeRow =
            Database["public"]["Tables"]["employee_details"]["Row"];

        const toEmployee = (e: EmployeeRow): Employee => ({
            id: e.id,
            userId: e.user_id,
            branchId: e.branch_id,
            baseSalary: e.base_salary,
            hireDate: e.hire_date,
            createdAt: e.created_at,
        });

        const { data: existing } = await supabaseAdmin
            .from("employee_details")
            .select("id")
            .eq("user_id", data.userId)
            .limit(1)
            .maybeSingle();

        if (existing) {
            return {
                success: false as const,
                error: "User already assigned to a branch",
            };
        }

        const { data: employee, error } = await supabaseAdmin
            .from("employee_details")
            .insert({
                id: crypto.randomUUID(),
                user_id: data.userId,
                branch_id: data.branchId,
                base_salary: data.baseSalary,
                hire_date: data.hireDate,
            })
            .select()
            .single();

        if (error || !employee)
            return {
                success: false as const,
                error: error?.message ?? "Gagal membuat employee",
            };

        void logAudit({
            actorId: auth.session.user.id,
            action: "create",
            targetTable: "employee_details",
            targetId: employee.id,
            branchId: employee.branch_id,
        });

        return { success: true as const, data: toEmployee(employee) };
    });

/**
 * Memperbarui data employee yang sudah ada.
 *
 * Partial update — hanya field yang dikirim yang akan diubah.
 * Mencatat audit log setelah berhasil.
 *
 * @returns Employee yang sudah diperbarui
 */
export const updateEmployeeFn = createServerFn({ method: "POST" })
    .validator(updateEmployeeSchema.extend({ id: z.string().min(1) }))
    .handler(async ({ data }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("update", "employee");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { rateLimit } = await import("@/lib/rate-limit");
        if (!rateLimit(`employee:update:${auth.session.user.id}`, 30, 60_000)) {
            return { success: false as const, error: "Too many requests" };
        }

        const { supabaseAdmin } = await import("@database/server");
        const { logAudit } = await import("@/lib/audit-log");

        const { id, ...input } = data;
        const updates: Database["public"]["Tables"]["employee_details"]["Update"] =
            {};
        if (input.userId !== undefined) updates.user_id = input.userId;
        if (input.branchId !== undefined) updates.branch_id = input.branchId;
        if (input.baseSalary !== undefined)
            updates.base_salary = input.baseSalary;
        if (input.hireDate !== undefined) updates.hire_date = input.hireDate;

        const { data: employee, error } = await supabaseAdmin
            .from("employee_details")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error || !employee) {
            return {
                success: false as const,
                error: error?.message ?? "Employee not found",
            };
        }

        void logAudit({
            actorId: auth.session.user.id,
            action: "update",
            targetTable: "employee_details",
            targetId: id,
            branchId: employee.branch_id,
            metadata: updates as Record<string, unknown>,
        });

        return {
            success: true as const,
            data: {
                id: employee.id,
                userId: employee.user_id,
                branchId: employee.branch_id,
                baseSalary: employee.base_salary,
                hireDate: employee.hire_date,
                createdAt: employee.created_at,
            } satisfies Employee,
        };
    });

/**
 * Menghapus employee. Hard delete.
 *
 * Mencatat audit log setelah berhasil.
 */
export const deleteEmployeeFn = createServerFn({ method: "POST" })
    .validator(z.object({ id: z.string().min(1) }))
    .handler(async ({ data: { id } }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("delete", "employee");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { rateLimit } = await import("@/lib/rate-limit");
        if (!rateLimit(`employee:delete:${auth.session.user.id}`, 10, 60_000)) {
            return { success: false as const, error: "Too many requests" };
        }

        const { supabaseAdmin } = await import("@database/server");
        const { logAudit } = await import("@/lib/audit-log");

        const { data: deleted } = await supabaseAdmin
            .from("employee_details")
            .delete()
            .eq("id", id)
            .select("branch_id")
            .maybeSingle();

        void logAudit({
            actorId: auth.session.user.id,
            action: "delete",
            targetTable: "employee_details",
            targetId: id,
            branchId: deleted?.branch_id,
        });

        return { success: true as const };
    });

/** @see {@link createEmployeeFn} */
export const useCreateEmployee = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateEmployeeInput) => createEmployeeFn({ data }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: employeeKeys.lists() });
            qc.invalidateQueries({ queryKey: employeeKeys.availableUsers() });
        },
    });
};

/** @see {@link updateEmployeeFn} */
export const useUpdateEmployee = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: UpdateEmployeeInput & { id: string }) =>
            updateEmployeeFn({ data }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: employeeKeys.lists() });
            qc.invalidateQueries({ queryKey: employeeKeys.availableUsers() });
        },
    });
};

/** @see {@link deleteEmployeeFn} */
export const useDeleteEmployee = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteEmployeeFn({ data: { id } }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: employeeKeys.lists() });
            qc.invalidateQueries({ queryKey: employeeKeys.availableUsers() });
        },
    });
};
