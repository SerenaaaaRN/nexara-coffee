import type {
    BranchRow as DBBranch,
    CustomerRow as DBCustomer,
    ReviewRow as DBReview,
} from "@database/types";
import { z } from "zod";
import type { ToCamelCase } from "@/utils/convert-types";

export type Review = ToCamelCase<DBReview>;

export type ReviewRow = Review & {
    branchName: string | null;
    customerName: string | null;
};

export type ReviewJoined = DBReview & {
    branches: Pick<DBBranch, "id" | "name"> | null;
    customers: Pick<DBCustomer, "id" | "full_name"> | null;
};

export const replyReviewSchema = z.object({
    reply: z.string().max(1000).optional().or(z.literal("")),
});
