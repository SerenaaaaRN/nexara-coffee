import {
    queryOptions,
    useQuery,
    useSuspenseQuery,
} from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import type { EmployeeJoined, EmployeeRow } from "@/features/employee/types";
import { employeeKeys } from "@/features/query-keys";
import { STALE } from "@/features/stale-time";

/**
 * Mengambil daftar employee beserta data user & branch.
 *
 * Data digabung dengan tabel user dan branches untuk menampilkan
 * informasi lengkap. Scope otomatis berdasarkan role:
 *   - super_admin/visitor → semua employee
 *   - branch_manager → employee di branch yang dikelola
 *   - lainnya → hanya dirinya sendiri
 *
 * Diurutkan berdasarkan hireDate (terlama dulu).
 *
 * @returns {EmployeeRow[]} Daftar employee dengan informasi user & branch
 */
export const getEmployeesFn = createServerFn({ method: "GET" }).handler(
    async () => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("read", "employee");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { supabaseAdmin } = await import("@database/server");
        const { getAccessibleBranchIds } = await import("@/utils/branch-scope");

        const ids = await getAccessibleBranchIds(
            auth.session.user.id,
            auth.session.user.role,
        );

        if (ids !== null && ids.length === 0) {
            return { success: true as const, data: [] satisfies EmployeeRow[] };
        }

        let empQuery = supabaseAdmin
            .from("employee_details")
            .select(
                "id, user_id, branch_id, base_salary, hire_date, created_at, user!employee_details_user_id_user_id_fk(id, name, email, role), branches!employee_details_branch_id_branches_id_fk(id, name)",
            )
            .order("hire_date", { ascending: true });

        if (ids !== null) empQuery = empQuery.in("branch_id", ids);

        const { data, error } = await empQuery;
        if (error) return { success: false as const, error: error.message };

        const dataRows: EmployeeRow[] = (
            (data ?? []) as unknown as EmployeeJoined[]
        )
            .filter((r) => r.user !== null && r.branches !== null)
            .map((r) => ({
                id: r.id,
                userId: r.user_id,
                branchId: r.branch_id,
                baseSalary: r.base_salary,
                hireDate: r.hire_date,
                createdAt: r.created_at,
                user: {
                    id: r.user!.id,
                    name: r.user!.name,
                    email: r.user!.email,
                    role: r.user!.role,
                },
                branch: { id: r.branches!.id, name: r.branches!.name },
            }));

        return { success: true as const, data: dataRows };
    },
);

/**
 * Mengambil daftar user yang tersedia untuk dijadikan employee.
 *
 * Digunakan di employee-form-dialog untuk dropdown pemilihan user.
 * Hanya mengembalikan id, name, email, dan role.
 *
 * @returns Daftar user (id, name, email, role)
 */
export const getAvailableUsersFn = createServerFn({ method: "GET" }).handler(
    async () => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("read", "employee");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { supabaseAdmin } = await import("@database/server");

        const { data, error } = await supabaseAdmin
            .from("user")
            .select("id, name, email, role")
            .order("name", { ascending: true });

        if (error) return { success: false as const, error: error.message };

        return { success: true as const, data: data ?? [] };
    },
);

/**
 * Mengambil daftar semua cabang (id & name) untuk dropdown form.
 *
 * Tidak memperhatikan branch scope — semua cabang dikembalikan
 * karena digunakan untuk form selection.
 *
 * @returns Daftar cabang (id, name)
 */
export const getBranchesFn = createServerFn({ method: "GET" }).handler(
    async () => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("read", "branches");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { supabaseAdmin } = await import("@database/server");

        const { data, error } = await supabaseAdmin
            .from("branches")
            .select("id, name")
            .order("name", { ascending: true });

        if (error) return { success: false as const, error: error.message };

        return { success: true as const, data: data ?? [] };
    },
);

export const employeesOptions = () =>
    queryOptions({
        queryKey: employeeKeys.lists(),
        queryFn: () => getEmployeesFn(),
        staleTime: STALE.FREQUENT,
    });

/** @see {@link getEmployeesFn} */
export const useEmployees = () => useSuspenseQuery(employeesOptions());

/** @see {@link getAvailableUsersFn} */
export const useAvailableUsers = () =>
    useQuery({
        queryKey: employeeKeys.availableUsers(),
        queryFn: () => getAvailableUsersFn(),
        staleTime: STALE.NORMAL,
    });

/** @see {@link getBranchesFn} */
export const useEmployeeBranches = () =>
    useQuery({
        queryKey: employeeKeys.branches(),
        queryFn: () => getBranchesFn(),
        staleTime: STALE.SLOW,
    });
