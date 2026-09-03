import { useMemo, useState } from "react";
import type { BranchRow } from "@/features/branches/types";

/**
 * Search cabang di sisi client.
 *
 * @param branches - Seluruh data cabang (biasanya dari useBranches)
 * @returns State search + hasil filter
 */
export const useBranchFilters = (branches: BranchRow[]) => {
    const [search, setSearch] = useState("");

    const filtered = useMemo(
        () =>
            search
                ? branches.filter((b) =>
                      b.name.toLowerCase().includes(search.toLowerCase()),
                  )
                : branches,
        [branches, search],
    );

    return { search, setSearch, filtered };
};
