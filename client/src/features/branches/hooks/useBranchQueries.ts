import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import type { BranchRow } from "@/features/branches/types";
import { branchKeys } from "@/features/query-keys";
import { STALE } from "@/features/stale-time";
import { api, type Envelope, toEnvelope } from "@/lib/eden";

/**
 * Mengambil daftar semua cabang dengan detail manajer.
 */
export const getBranches = async (): Promise<Envelope<BranchRow[]>> => {
    const { data, error } = await api.branches.get();
    return toEnvelope(data, error);
};

export const branchesOptions = () =>
    queryOptions({
        queryKey: branchKeys.lists(),
        queryFn: () => getBranches(),
        staleTime: STALE.FREQUENT,
    });

export function useBranches() {
    return useSuspenseQuery(branchesOptions());
}
