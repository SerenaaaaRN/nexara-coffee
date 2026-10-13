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
 * Search/filter/sort/page di-resolve di server.
 */
export const getEmployees = async (params?: EmployeeFilters) => {
    const { data, error } = await api.employees.get({
        query: {
            branchId: params?.branchId,
            role: params?.role,
            q: params?.q,
            page: params?.page,
            pageSize: params?.pageSize,
            sortBy: params?.sortBy,
            sortDir: params?.sortDir,
        },
    });
    return toEnvelope(data, error);
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

export type EmployeeFilters = {
    branchId?: string;
    role?: string;
    q?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortDir?: "asc" | "desc";
};

export const employeesOptions = (params?: EmployeeFilters) =>
    queryOptions({
        queryKey: employeeKeys.list(params),
        queryFn: () => getEmployees(params),
        staleTime: STALE.FREQUENT,
    });

export const employeesTableOptions = (params?: EmployeeFilters) =>
    queryOptions({
        queryKey: employeeKeys.list(params),
        queryFn: () => getEmployees(params),
        staleTime: STALE.FREQUENT,
        placeholderData: (previousData) => previousData,
    });

export const useEmployees = (params?: EmployeeFilters) =>
    useSuspenseQuery(employeesOptions(params));

export const useEmployeesTableQuery = (params?: EmployeeFilters) =>
    useQuery(employeesTableOptions(params));

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
