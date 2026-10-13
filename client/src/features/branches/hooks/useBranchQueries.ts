import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { branchKeys } from "@/features/query-keys";
import { STALE } from "@/features/stale-time";
import { api, toEnvelope } from "@/lib/eden";

export type BranchFilters = {
    q?: string;
};

/**
 * Mengambil daftar semua cabang dengan detail manajer.
 * Search (`q`) di-resolve di server.
 */
export const getBranches = async (params?: BranchFilters) => {
    const { data, error } = await api.branches.get({
        query: { q: params?.q },
    });
    return toEnvelope(data, error);
};

export const branchesOptions = (params?: BranchFilters) =>
    queryOptions({
        queryKey: branchKeys.list(params),
        queryFn: () => getBranches(params),
        staleTime: STALE.FREQUENT,
    });

export const useBranches = (params?: BranchFilters) => {
    return useSuspenseQuery(branchesOptions(params));
};
