import type {
    BranchRow as DBBranch,
    DailySetoranRow as DBSetoran,
    UserRow as DBUser,
} from "@database/types";
import { z } from "zod";
import type { ToCamelCase } from "@/utils/convert-types";

export type Setoran = ToCamelCase<DBSetoran>;

export type SetoranRow = Setoran & {
    branchName: string | null;
    cashierName: string | null;
    verifiedByName: string | null;
};

export type SetoranJoined = DBSetoran & {
    branches: Pick<DBBranch, "id" | "name"> | null;
    cashier: Pick<DBUser, "id" | "name"> | null;
    verified_by_user: Pick<DBUser, "id" | "name"> | null;
};

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
