import {
    keepPreviousData,
    queryOptions,
    useQuery,
} from "@tanstack/react-query";
import type { BranchMarker } from "@/features/maps/types";
import { mapKeys } from "@/features/query-keys";
import { STALE } from "@/features/stale-time";
import { api, type Envelope, toEnvelope } from "@/lib/eden";

/**
 * Mengambil data cabang yang memiliki koordinat geografis (lat/lng)
 * untuk ditampilkan di halaman Maps. Search (`q`) di-resolve di server.
 */
export const getMapBranches = async (
    q?: string,
): Promise<Envelope<BranchMarker[]>> => {
    const { data, error } = await api.maps.branches.get({
        query: { q },
    });
    return toEnvelope(data, error);
};

export const mapBranchesOptions = (q?: string) =>
    queryOptions({
        queryKey: mapKeys.branches(q),
        queryFn: () => getMapBranches(q),
        staleTime: STALE.SLOW,
    });

/** @see {@link getMapBranches} */
export const useMapBranches = (q?: string) => {
    return useQuery({
        ...mapBranchesOptions(q),
        placeholderData: keepPreviousData,
    });
};
