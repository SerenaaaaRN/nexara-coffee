import { z } from "zod";
import type { api, GetData } from "@/lib/eden";

/**
 * Baris setoran — from eden treaty (source of truth: server).
 * Termasuk `branchName`, `cashierName`, `verifiedByName` flat hasil join.
 */
export type SetoranRow = GetData<typeof api.kasir.setorans.get>["rows"][number];

/** Ringkasan agregat setoran — from eden treaty. */
export type SetoranSummary = GetData<typeof api.kasir.setorans.get>["summary"];

export type Setoran = Omit<
    SetoranRow,
    "branchName" | "cashierName" | "verifiedByName"
>;

/** Ringkasan kas harian dari POS — from eden treaty. */
export type ExpectedCash = GetData<(typeof api.kasir)["expected-cash"]["get"]>;

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
