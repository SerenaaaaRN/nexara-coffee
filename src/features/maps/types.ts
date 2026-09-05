import type { BranchRow as DBBranch, UserRow as DBUser } from "@database/types";
import type { ToCamelCase } from "@/utils/convert-types";

export type BranchMarkerJoined = Pick<
    DBBranch,
    | "id"
    | "name"
    | "address"
    | "lat"
    | "lng"
    | "phone"
    | "opening_time"
    | "closing_time"
    | "status"
    | "ownership_type"
> & {
    manager: Pick<DBUser, "name"> | null;
};

export type BranchMarker = Omit<ToCamelCase<BranchMarkerJoined>, "manager"> & {
    managerName: string | null;
};
