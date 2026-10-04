/**
 * Menyiapkan scope akses untuk semua server function di halaman overview.
 *
 * Bertanggung jawab untuk:
 * - Validasi RBAC "read" pada resource "reports"
 * - Resolusi daftar cabang yang boleh diakses user (`ids`)
 * - Normalisasi parameter filter cabang (`branchId`)
 *
 * Dipakai oleh useOverviewDashboard agar boilerplate auth + branch-scope
 * tidak diulang di setiap query data.
 *
 * @param branch - Filter cabang dari search params (opsional)
 * @returns Objek `{ success: true, ids, branchId }` jika diizinkan,
 *          atau `{ success: false, error }` jika akses ditolak.
 */
export async function resolveOverviewScope(branch?: string | null) {
    const { requireAccessAction } = await import("@/lib/with-auth.server");
    const auth = await requireAccessAction("read", "reports");
    if (!auth.success) return { success: false as const, error: auth.error };

    const { getAccessibleBranchIds } = await import("@/utils/branch-scope");
    const ids = await getAccessibleBranchIds(
        auth.session.user.id,
        auth.session.user.role,
    );

    return { success: true as const, ids, branchId: branch ?? null };
}
