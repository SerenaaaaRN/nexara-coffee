import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import type { BranchMarker, BranchMarkerJoined } from "@/features/maps/types";
import { mapKeys } from "@/features/query-keys";
import { STALE } from "@/features/stale-time";

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
export const getMapBranchesFn = createServerFn({ method: "GET" }).handler(
    async () => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("read", "maps");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { supabaseAdmin } = await import("@database/server");

        const { data, error } = await supabaseAdmin
            .from("branches")
            .select(
                "id, name, address, lat, lng, phone, opening_time, closing_time, status, ownership_type, manager:user!branches_manager_id_user_id_fk(name)",
            )
            .not("lat", "is", null)
            .not("lng", "is", null);

        if (error) return { success: false as const, error: error.message };

        const joined = (data ?? []) as unknown as BranchMarkerJoined[];

        const rows: BranchMarker[] = joined.map((r) => ({
            id: r.id,
            name: r.name,
            address: r.address,
            lat: r.lat,
            lng: r.lng,
            phone: r.phone,
            openingTime: r.opening_time,
            closingTime: r.closing_time,
            status: r.status,
            ownershipType: r.ownership_type,
            managerName: r.manager?.name ?? null,
        }));

        return { success: true as const, data: rows };
    },
);

export const mapBranchesOptions = () =>
    queryOptions({
        queryKey: mapKeys.branches(),
        queryFn: () => getMapBranchesFn(),
        staleTime: STALE.SLOW,
    });

/** @see {@link getMapBranchesFn} */
export const useMapBranches = () => {
    return useSuspenseQuery(mapBranchesOptions());
};
