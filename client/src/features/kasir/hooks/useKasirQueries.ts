import {
    queryOptions,
    useQuery,
    useSuspenseQuery,
} from "@tanstack/react-query";
import { kasirKeys } from "@/features/query-keys";
import { api, toEnvelope } from "@/lib/eden";

/**
 * Menghitung total transaksi POS per metode pembayaran untuk hari tertentu.
 * Data ini dipakai sebagai referensi saat cashier input setoran dan saat approver review.
 */
export const getExpectedCash = async (branchId: string, date: string) => {
    const { data, error } = await api.kasir["expected-cash"].get({
        query: { branchId, date },
    });
    return toEnvelope(data, error);
};

export const useExpectedCash = (
    branchId: string,
    date: string,
    opts?: { enabled?: boolean },
) =>
    useQuery({
        queryKey: kasirKeys.expectedCash(branchId, date),
        queryFn: () => getExpectedCash(branchId, date),
        staleTime: 0,
        enabled: opts?.enabled ?? (!!branchId && !!date),
    });

/**
 * Mengambil data setoran harian beserta nama branch, cashier, dan verifier.
 */
export const getSetorans = async (branch?: string | null) => {
    const { data, error } = await api.kasir.setorans.get({
        query: branch ? { branch } : {},
    });
    return toEnvelope(data, error);
};

export const setoransOptions = (branch?: string | null) =>
    queryOptions({
        queryKey: branch ? kasirKeys.list({ branch }) : kasirKeys.lists(),
        queryFn: () => getSetorans(branch),
        staleTime: 0,
    });

export const useSetorans = (branch?: string | null) =>
    useSuspenseQuery(setoransOptions(branch));
