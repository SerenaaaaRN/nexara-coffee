import { z } from "zod";

export const PAYMENT_METHODS = ["cash", "qris", "debit", "credit"] as const;

export interface Transaction {
    id: string;
    orderId: string;
    branchId: string;
    paymentMethod: string;
    amount: string;
    status: string;
    createdAt: string;
}

export type TransactionRow = Transaction & {
    orderNumber: string | null;
    branchName: string | null;
};

export interface TransactionJoined {
    id: string;
    order_id: string;
    branch_id: string;
    payment_method: string;
    amount: string;
    status: string;
    created_at: string;
    orders: { id: string; order_number: string } | null;
    branches: { id: string; name: string } | null;
}

export const recordTransactionSchema = z.object({
    orderId: z.string().min(1, "Order is required"),
    branchId: z.string().min(1, "Branch is required"),
    paymentMethod: z.enum(PAYMENT_METHODS),
    amount: z.coerce.number().positive("Amount must be positive"),
});

export const refundTransactionSchema = z.object({
    transactionId: z.string().min(1),
});
