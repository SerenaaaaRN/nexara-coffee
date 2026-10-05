import type {
    BranchRow as DBBranch,
    PayoutRow as DBPayout,
    UserRow as DBUser,
} from "@database/types";
import { z } from "zod";
import type { ToCamelCase } from "@/utils/convert-types";

export type Payout = ToCamelCase<DBPayout>;

export type PayoutRow = Payout & {
    franchiseOwnerName: string | null;
    branchName: string | null;
    approvedByName: string | null;
};

export type PayoutJoined = DBPayout & {
    franchise_owner: Pick<DBUser, "id" | "name"> | null;
    branches: Pick<DBBranch, "id" | "name"> | null;
    approved_by_user: Pick<DBUser, "id" | "name"> | null;
};

export const PAYOUT_STATUSES = ["pending", "approved", "paid"] as const;

export const requestPayoutSchema = z.object({
    branchId: z.string().min(1, "Branch is required"),
    amount: z.coerce.number().positive("Amount must be positive"),
    periodStart: z.string().min(1, "Start date is required"),
    periodEnd: z.string().min(1, "End date is required"),
});

export const approvePayoutSchema = z.object({
    payoutId: z.string().min(1),
});
