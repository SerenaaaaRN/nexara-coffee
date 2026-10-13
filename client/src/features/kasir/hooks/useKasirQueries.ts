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
 * Search/filter/sort/page di-resolve di server.
 */
export const getSetorans = async (params?: SetoranFilters) => {
    const { data, error } = await api.kasir.setorans.get({
        query: {
            branch: params?.branch ?? undefined,
            status: params?.status,
            q: params?.q,
            page: params?.page,
            pageSize: params?.pageSize,
            sortBy: params?.sortBy,
            sortDir: params?.sortDir,
        },
    });
    return toEnvelope(data, error);
};

export type SetoranFilters = {
    branch?: string | null;
    status?: string;
    q?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortDir?: "asc" | "desc";
};

export const setoransOptions = (params?: SetoranFilters) =>
    queryOptions({
        queryKey: kasirKeys.list(params),
        queryFn: () => getSetorans(params),
        staleTime: 0,
    });

export const setoransTableOptions = (params?: SetoranFilters) =>
    queryOptions({
        queryKey: kasirKeys.list(params),
        queryFn: () => getSetorans(params),
        staleTime: 0,
        placeholderData: (previousData) => previousData,
    });

export const useSetorans = (params?: SetoranFilters) =>
    useSuspenseQuery(setoransOptions(params));

export const useSetoransTableQuery = (params?: SetoranFilters) =>
    useQuery(setoransTableOptions(params));
