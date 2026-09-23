/**
 * Cache per-Request (WeakMap keyed by Request object) supaya scope cabang
 * hanya dihitung 1x dalam satu request-lifecycle (mis. SSR layout + loader
 * overview yang memanggil fungsi ini berkali-kali).
 */
const scopeCache = new WeakMap<Request, Map<string, string[] | null>>();

/**
 * Mengembalikan daftar ID cabang yang boleh diakses oleh seorang user
 * berdasarkan role-nya. Fungsi ini digunakan oleh layout, server actions,
 * dan komponen lain yang perlu membatasi akses ke cabang tertentu.
 *
 * Logic per role:
 * - `super_admin`              → bisa lihat SEMUA cabang (`null`)
 * - `branch_manager`           → cabang di mana dia adalah managernya
 * - `franchise_owner`          → cabang yang terdaftar di franchise_branches
 * - `cashier` / `barista`      → cabang dari employee_details
 *
 * @param userId - ID user yang sedang login.
 * @param role   - Role user (mis. "super_admin", "branch_manager").
 * @returns `null` jika user bisa akses semua cabang (caller tidak perlu filter).
 *          `string[]` berisi ID cabang yang boleh diakses.
 *          `[]` jika user tidak punya akses ke cabang manapun.
 */
export async function getAccessibleBranchIds(
    userId: string,
    role: string,
): Promise<string[] | null> {
    const cacheKey = `${role}:${userId}`;

    let req: Request | null = null;
    try {
        const { getRequest } = await import("@tanstack/react-start/server");
        req = getRequest() as unknown as Request;
    } catch {
        req = null;
    }

    if (req) {
        const memo = scopeCache.get(req) ?? new Map();
        const cached = memo.get(cacheKey);
        if (cached !== undefined) return cached;
        const ids = await resolveBranchScope(userId, role);
        memo.set(cacheKey, ids);
        scopeCache.set(req, memo);
        return ids;
    }

    return resolveBranchScope(userId, role);
}

async function resolveBranchScope(
    userId: string,
    role: string,
): Promise<string[] | null> {
    if (role === "super_admin") {
        return null;
    }

    const { supabaseAdmin } = await import("@database/server");

    if (role === "branch_manager") {
        const { data, error } = await supabaseAdmin
            .from("branches")
            .select("id")
            .eq("manager_id", userId);
        if (error) throw new Error(error.message);
        return (data ?? []).map((r) => r.id);
    }

    if (role === "franchise_owner") {
        const { data, error } = await supabaseAdmin
            .from("franchise_branches")
            .select("branch_id")
            .eq("user_id", userId);
        if (error) throw new Error(error.message);
        return (data ?? []).map((r) => r.branch_id);
    }

    if (role === "cashier" || role === "barista") {
        const { data, error } = await supabaseAdmin
            .from("employee_details")
            .select("branch_id")
            .eq("user_id", userId);
        if (error) throw new Error(error.message);
        return (data ?? []).map((r) => r.branch_id);
    }

    return [];
}
