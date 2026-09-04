import { z } from "zod";

export interface Setoran {
    id: string;
    branchId: string;
    cashierId: string;
    amount: string;
    date: string;
    status: string;
    verifiedBy: string | null;
    notes: string | null;
    createdAt: string;
}

export interface SetoranRow extends Setoran {
    branchName: string | null;
    cashierName: string | null;
    verifiedByName: string | null;
}

export interface SetoranJoined {
    id: string;
    branch_id: string;
    cashier_id: string;
    amount: string;
    date: string;
    status: string;
    verified_by: string | null;
    notes: string | null;
    created_at: string;
    branches: { id: string; name: string } | null;
    cashier: { id: string; name: string } | null;
    verified_by_user: { id: string; name: string } | null;
}

export interface ExpectedCash {
    cashTotal: number;
    qrisTotal: number;
    debitTotal: number;
    creditTotal: number;
    total: number;
}

export const createSetoranSchema = z.object({
    amount: z.coerce.number().positive("Amount must be positive"),
    date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
        .refine((d) => {
            const today = new Date().toISOString().split("T")[0];
            return d <= today;
        }, "Date cannot be in the future"),
    notes: z.string().max(500).optional().or(z.literal("")),
});

export const approveSetoranSchema = z.object({
    notes: z.string().max(500).optional().or(z.literal("")),
});
