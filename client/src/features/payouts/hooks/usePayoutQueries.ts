import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { payoutKeys } from "@/features/query-keys";
import { STALE } from "@/features/stale-time";
import { api, toEnvelope } from "@/lib/eden";

export type PayoutFilters = {
    branchId?: string;
    status?: string;
};

/**
 * Mengambil data payout beserta informasi franchise owner, branch, dan approver.
 * Filterable berdasarkan branch dan status.
 * Data difilter berdasarkan role pengguna (franchise owner hanya melihat branch mereka).
 */
export const getPayouts = async (params?: PayoutFilters) => {
    const { data, error } = await api.payouts.get({
        query: {
            branchId: params?.branchId,
            status: params?.status,
        },
    });
    const envelope = toEnvelope(data, error);
    if (!envelope.success) throw new Error(envelope.error);
    return envelope.data;
};

export const payoutsOptions = (params?: PayoutFilters) =>
    queryOptions({
        queryKey: payoutKeys.list(params),
        queryFn: () => getPayouts(params),
        staleTime: STALE.FREQUENT,
    });

export function usePayouts(params?: PayoutFilters) {
    return useSuspenseQuery(payoutsOptions(params));
}
