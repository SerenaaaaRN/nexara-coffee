import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import type { BranchJoined, BranchRow } from "@/features/branches/types";
import { branchKeys } from "@/features/query-keys";
import { STALE } from "@/features/stale-time";

/**
 * Mengambil daftar semua cabang dengan detail manajer.
 *
 * Data di-filter berdasarkan hak akses user (branch scope). Jika user memiliki
 * akses ke semua cabang (super_admin), semua cabang dikembalikan.
 * Data digabung dengan tabel user untuk mendapatkan nama dan email manajer.
 *
 * @returns {BranchRow[]} Daftar cabang dengan informasi manajer
 */
export const getBranchesFn = createServerFn({ method: "GET" }).handler(
    async () => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("read", "branches");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { supabaseAdmin } = await import("@database/server");
        const { getAccessibleBranchIds } = await import("@/utils/branch-scope");

        const ids = await getAccessibleBranchIds(
            auth.session.user.id,
            auth.session.user.role,
        );

        let branchQuery = supabaseAdmin
            .from("branches")
            .select(
                "id, name, address, lat, lng, phone, opening_time, closing_time, status, ownership_type, manager_id, created_at, updated_at, manager:user!branches_manager_id_user_id_fk(id, name, email)",
            )
            .order("name", { ascending: true });

        if (ids !== null) {
            if (ids.length === 0) return { success: true as const, data: [] };
            branchQuery = branchQuery.in("id", ids);
        }

        const { data: branchData, error: branchError } = await branchQuery;
        if (branchError)
            return { success: false as const, error: branchError.message };

        const joined = (branchData ?? []) as unknown as BranchJoined[];
        const branchIds = joined.map((b) => b.id);

        const empCounts = new Map<string, number>();
        if (branchIds.length > 0) {
            const { data: empData, error: empError } = await supabaseAdmin
                .from("employee_details")
                .select("branch_id")
                .in("branch_id", branchIds);
            if (empError)
                return { success: false as const, error: empError.message };
            for (const e of empData ?? [])
                empCounts.set(
                    e.branch_id,
                    (empCounts.get(e.branch_id) ?? 0) + 1,
                );
        }

        const data: BranchRow[] = joined.map((r) => ({
            id: r.id,
            name: r.name,
            address: r.address,
            lat: r.lat,
            lng: r.lng,
            phone: r.phone,
            openingTime: r.opening_time,
            closingTime: r.closing_time,
            status: r.status,
            ownershipType: r.ownership_type,
            managerId: r.manager_id,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
            manager: r.manager
                ? {
                      id: r.manager.id,
                      name: r.manager.name,
                      email: r.manager.email,
                  }
                : null,
            employeeCount: empCounts.get(r.id) ?? 0,
        }));

        return { success: true as const, data };
    },
);

export const branchesOptions = () =>
    queryOptions({
        queryKey: branchKeys.lists(),
        queryFn: () => getBranchesFn(),
        staleTime: STALE.FREQUENT,
    });

/** @see {@link getBranchesFn} */
export function useBranches() {
    return useSuspenseQuery(branchesOptions());
}
