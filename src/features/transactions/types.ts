import type {
    BranchRow as DBBranch,
    OrderRow as DBOrder,
    TransactionRow as DBTransaction,
} from "@database/types";
import { z } from "zod";
import type { ToCamelCase } from "@/utils/convert-types";

export const PAYMENT_METHODS = ["cash", "qris", "debit", "credit"] as const;

export type Transaction = ToCamelCase<DBTransaction>;

export type TransactionRow = Transaction & {
    orderNumber: string | null;
    branchName: string | null;
};

export type TransactionJoined = DBTransaction & {
    orders: Pick<DBOrder, "id" | "order_number"> | null;
    branches: Pick<DBBranch, "id" | "name"> | null;
};

export const recordTransactionSchema = z.object({
    orderId: z.string().min(1, "Order is required"),
    branchId: z.string().min(1, "Branch is required"),
    paymentMethod: z.enum(PAYMENT_METHODS),
    amount: z.coerce.number().positive("Amount must be positive"),
});

export const refundTransactionSchema = z.object({
    transactionId: z.string().min(1),
});
