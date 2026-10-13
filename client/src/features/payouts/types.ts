import { z } from "zod";
import type { api, GetData } from "@/lib/eden";

/**
 * Baris payout — from eden treaty (source of truth: server).
 * Termasuk 3 nama join flat (`franchiseOwnerName`, `branchName`,
 * `approvedByName`) dari service.
 */
export type PayoutRow = GetData<typeof api.payouts.get>["rows"][number];

/** Ringkasan agregat payouts — from eden treaty. */
export type PayoutSummary = GetData<typeof api.payouts.get>["summary"];

export type Payout = Omit<
    PayoutRow,
    "franchiseOwnerName" | "branchName" | "approvedByName"
>;

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
