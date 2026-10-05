import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import type { BranchMarker } from "@/features/maps/types";
import { mapKeys } from "@/features/query-keys";
import { STALE } from "@/features/stale-time";
import { api, type Envelope, toEnvelope } from "@/lib/eden";

/**
 * Mengambil data cabang yang memiliki koordinat geografis (lat/lng)
 * untuk ditampilkan di halaman Maps.
 *
 * Semua role bisa melihat semua cabang. Hanya cabang dengan kolom `lat`
 * tidak null yang dikembalikan.
 *
 * @returns {BranchMarker[]} Daftar cabang dengan koordinat, nama, alamat,
 *   jam operasional, status, dan nama manager
 */
export const getMapBranches = async (): Promise<Envelope<BranchMarker[]>> => {
    const { data, error } = await api.maps.branches.get();
    return toEnvelope(data, error);
};

export const mapBranchesOptions = () =>
    queryOptions({
        queryKey: mapKeys.branches(),
        queryFn: () => getMapBranches(),
        staleTime: STALE.SLOW,
    });

/** @see {@link getMapBranches} */
export const useMapBranches = () => {
    return useSuspenseQuery(mapBranchesOptions());
};
