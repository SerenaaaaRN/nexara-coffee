import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
    CreateEmployeeInput,
    UpdateEmployeeInput,
} from "@/features/employee/types";
import { employeeKeys } from "@/features/query-keys";
import { api, toEnvelope } from "@/lib/eden";

/**
 * Menambahkan employee baru (mengaitkan user ke branch).
 *
 * Server menolak user yang sudah terdaftar (409) — validasi duplikasi
 * user per branch. Mencatat audit log setelah berhasil.
 *
 * @returns Data employee yang baru dibuat
 */
export const createEmployee = async (input: CreateEmployeeInput) => {
    const { data, error } = await api.employees.post({
        userId: input.userId,
        branchId: input.branchId,
        baseSalary: Number(input.baseSalary),
        hireDate: input.hireDate,
    });
    return toEnvelope(data, error);
};

/**
 * Memperbarui data employee yang sudah ada.
 *
 * Partial update — hanya field yang dikirim yang akan diubah.
 * Mencatat audit log setelah berhasil.
 *
 * @returns Employee yang sudah diperbarui
 */
export const updateEmployee = async (
    input: UpdateEmployeeInput & { id: string },
) => {
    const { id, ...rest } = input;
    const { data, error } = await api.employees({ id }).put({
        branchId: rest.branchId,
        baseSalary:
            rest.baseSalary === undefined ? undefined : Number(rest.baseSalary),
        hireDate: rest.hireDate,
    });
    return toEnvelope(data, error);
};

/**
 * Menghapus employee. Hard delete.
 *
 * Mencatat audit log setelah berhasil.
 */
export const deleteEmployee = async (id: string) => {
    const { data, error } = await api.employees({ id }).delete();
    return toEnvelope(data, error);
};

/** @see {@link createEmployee} */
export const useCreateEmployee = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateEmployeeInput) => createEmployee(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: employeeKeys.lists() });
            qc.invalidateQueries({ queryKey: employeeKeys.availableUsers() });
        },
    });
};

/** @see {@link updateEmployee} */
export const useUpdateEmployee = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: UpdateEmployeeInput & { id: string }) =>
            updateEmployee(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: employeeKeys.lists() });
            qc.invalidateQueries({ queryKey: employeeKeys.availableUsers() });
        },
    });
};

/** @see {@link deleteEmployee} */
export const useDeleteEmployee = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteEmployee(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: employeeKeys.lists() });
            qc.invalidateQueries({ queryKey: employeeKeys.availableUsers() });
        },
    });
};
