import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { userKeys } from "@/features/query-keys";
import type { SettingsUser } from "@/features/settings/types";
import { STALE } from "@/features/stale-time";

/**
 * Mengambil daftar user untuk Settings > User Management.
 *
 * Hanya mengembalikan user dengan role level di bawah role user yang login.
 * Scope: super_admin lihat semua, branch_manager lihat user di branch-nya.
 *
 * @returns {SettingsUser[]} Daftar user (id, name, email, role, image)
 */
export const getUsersFn = createServerFn({ method: "GET" }).handler(
    async () => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("read", "users");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { supabaseAdmin } = await import("@database/server");

        const myLevel =
            {
                super_admin: 0,
                branch_manager: 1,
                franchise_owner: 2,
                cashier: 3,
                barista: 4,
                visitor: 5,
            }[auth.session.user.role] ?? 999;

        const { data: rows, error } = await supabaseAdmin
            .from("user")
            .select("id, name, email, role, image")
            .neq("id", auth.session.user.id)
            .order("created_at");

        if (error) return { success: false as const, error: error.message };

        const data: SettingsUser[] = (rows ?? [])
            .filter((r) => {
                const userLevel =
                    {
                        super_admin: 0,
                        branch_manager: 1,
                        franchise_owner: 2,
                        cashier: 3,
                        barista: 4,
                        visitor: 5,
                    }[r.role] ?? 999;
                return userLevel > myLevel;
            })
            .map((r) => ({
                id: r.id,
                name: r.name,
                email: r.email,
                role: r.role,
                image: r.image,
            }));

        return { success: true as const, data };
    },
);

export const usersOptions = () =>
    queryOptions({
        queryKey: userKeys.lists(),
        queryFn: () => getUsersFn(),
        staleTime: STALE.FREQUENT,
    });

/**
 * @see {@link getUsersFn}
 */
export const useUsers = () => {
    return useSuspenseQuery(usersOptions());
};
