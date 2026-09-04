import { z } from "zod";

export interface Payout {
    id: string;
    franchiseOwnerId: string;
    branchId: string;
    amount: string;
    periodStart: string;
    periodEnd: string;
    status: string;
    approvedBy: string | null;
    createdAt: string;
}

export type PayoutRow = Payout & {
    franchiseOwnerName: string | null;
    branchName: string | null;
    approvedByName: string | null;
};

export interface PayoutJoined {
    id: string;
    franchise_owner_id: string;
    branch_id: string;
    amount: string;
    period_start: string;
    period_end: string;
    status: string;
    approved_by: string | null;
    created_at: string;
    franchise_owner: { id: string; name: string } | null;
    branches: { id: string; name: string } | null;
    approved_by_user: { id: string; name: string } | null;
}

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
