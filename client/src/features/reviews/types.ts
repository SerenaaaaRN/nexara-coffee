import { z } from "zod";
import type { api, GetData } from "@/lib/eden";

/**
 * Entity review — from eden treaty.
 */
export type ReviewRow = GetData<typeof api.reviews.get>[number];

/** Review tanpa nama join (balikan endpoint reply/moderate). */
export type Review = Omit<ReviewRow, "branchName" | "customerName">;

export const replyReviewSchema = z.object({
    reply: z.string().max(1000).optional().or(z.literal("")),
});
