import type { api, GetData } from "@/lib/eden";

/**
 * Marker cabang untuk peta — from eden treaty (source of truth: server).
 * Termasuk `managerName` flat hasil join di service.
 */
export type BranchMarker = GetData<typeof api.maps.branches.get>[number];
