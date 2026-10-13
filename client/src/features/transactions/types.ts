import { z } from "zod";
import type { api, GetData } from "@/lib/eden";

export const PAYMENT_METHODS = ["cash", "qris", "debit", "credit"] as const;

/**
 * Baris transaksi — from eden treaty (source of truth: server).
 * Termasuk `orderNumber` + `branchName` flat hasil join di service.
 */
export type TransactionRow = GetData<
    typeof api.transactions.get
>["rows"][number];

/** Ringkasan agregat transaksi — from eden treaty. */
export type TransactionSummary = GetData<
    typeof api.transactions.get
>["summary"];

export type Transaction = Omit<TransactionRow, "orderNumber" | "branchName">;

export const recordTransactionSchema = z.object({
    orderId: z.string().min(1, "Order is required"),
    branchId: z.string().min(1, "Branch is required"),
    paymentMethod: z.enum(PAYMENT_METHODS),
    amount: z.coerce.number().positive("Amount must be positive"),
});

export const refundTransactionSchema = z.object({
    transactionId: z.string().min(1),
});
