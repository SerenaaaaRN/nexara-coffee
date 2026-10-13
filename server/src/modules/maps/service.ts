import { ok } from "../../lib/http.js";
import type { mapBranchesQuery } from "./model.js";
import { mapRepo } from "./repository.js";

export const getMapBranches = async (
	params?: typeof mapBranchesQuery.static,
) => {
	return ok(await mapRepo.branches(params?.q));
};
