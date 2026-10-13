import { queryOptions, useQuery } from "@tanstack/react-query";
import { payoutKeys } from "@/features/query-keys";
import { STALE } from "@/features/stale-time";
import { api, toEnvelope } from "@/lib/eden";

export type PayoutFilters = {
    branchId?: string;
    status?: string;
};

export type PayoutsTableParams = {
    q?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortDir?: "asc" | "desc";
};

/**
 * Mengambil data payout beserta informasi franchise owner, branch, dan approver.
 * Filterable berdasarkan branch dan status.
 * Data difilter berdasarkan role pengguna (franchise owner hanya melihat branch mereka).
 * Search/sort/page di-resolve di server.
 */
export const getPayouts = async (
    params?: PayoutFilters & PayoutsTableParams,
) => {
    const { data, error } = await api.payouts.get({
        query: {
            branchId: params?.branchId,
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

export const payoutsOptions = (params?: PayoutFilters & PayoutsTableParams) =>
    queryOptions({
        queryKey: payoutKeys.list(params),
        queryFn: () => getPayouts(params),
        staleTime: STALE.FREQUENT,
    });

/**
 * Query tabel payouts (non-suspense): `placeholderData` menahan halaman
 * lama saat `q/page/sort` berubah agar tidak kedip.
 */
export const payoutsTableOptions = (
    params?: PayoutFilters & PayoutsTableParams,
) =>
    queryOptions({
        queryKey: payoutKeys.list(params),
        queryFn: () => getPayouts(params),
        staleTime: STALE.FREQUENT,
        placeholderData: (previousData) => previousData,
    });

export const usePayoutsTableQuery = (
    params?: PayoutFilters & PayoutsTableParams,
) => {
    return useQuery(payoutsTableOptions(params));
};
