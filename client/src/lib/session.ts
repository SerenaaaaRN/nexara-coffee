import { api, toEnvelope } from "@/lib/eden";

/**
 * Mengambil sesi login dari server (Better Auth, cookie).
 */
export const getSession = async () => {
    const { data, error } = await api.auth.session.get();
    const envelope = toEnvelope(data, error);
    return envelope.success ? envelope.data : null;
};

/**
 * Memuat metadata dashboard: daftar cabang dalam scope,
 * flag super admin, dan cabang default untuk BranchSwitcher.
 */
export const loadDashboard = async () => {
    const { data, error } = await api.dashboard.meta.get();
    const envelope = toEnvelope(data, error);
    if (!envelope.success) throw new Error(envelope.error);
    const { isSuperAdmin, branchList, defaultBranchId } = envelope.data;
    return { isSuperAdmin, branchList, defaultBranchId };
};
