import {
    queryOptions,
    useQuery,
    useSuspenseQuery,
} from "@tanstack/react-query";
import { employeeKeys } from "@/features/query-keys";
import { STALE } from "@/features/stale-time";
import { api, toEnvelope } from "@/lib/eden";

/**
 * Mengambil daftar employee beserta nama user & cabang (flat).
 * Scope otomatis berdasarkan role (dihitung di server).
 * Diurutkan berdasarkan hireDate (terlama dulu).
 */
export const getEmployees = async () => {
    const { data, error } = await api.employees.get();
    const envelope = toEnvelope(data, error);
    if (!envelope.success) return envelope;
    return {
        success: true as const,
        data: [...envelope.data].sort((a, b) =>
            a.hireDate < b.hireDate ? -1 : a.hireDate > b.hireDate ? 1 : 0,
        ),
    };
};

/**
 * Mengambil daftar user yang tersedia untuk dijadikan employee
 * (user yang belum terdaftar sebagai employee).
 *
 * Digunakan di employee-form-dialog untuk dropdown pemilihan user.
 */
export const getAvailableUsers = async () => {
    const { data, error } = await api.employees["available-users"].get();
    const envelope = toEnvelope(data, error);
    if (!envelope.success) return envelope;
    return {
        success: true as const,
        data: [...envelope.data].sort((a, b) => a.name.localeCompare(b.name)),
    };
};

/**
 * Mengambil daftar semua cabang (id & name) untuk dropdown form.
 */
export const getEmployeeBranches = async () => {
    const { data, error } = await api.employees.branches.get();
    return toEnvelope(data, error);
};

export const employeesOptions = () =>
    queryOptions({
        queryKey: employeeKeys.lists(),
        queryFn: () => getEmployees(),
        staleTime: STALE.FREQUENT,
    });

export const useEmployees = () => useSuspenseQuery(employeesOptions());

export const useAvailableUsers = () =>
    useQuery({
        queryKey: employeeKeys.availableUsers(),
        queryFn: () => getAvailableUsers(),
        staleTime: STALE.NORMAL,
    });

export const useEmployeeBranches = () =>
    useQuery({
        queryKey: employeeKeys.branches(),
        queryFn: () => getEmployeeBranches(),
        staleTime: STALE.SLOW,
    });
