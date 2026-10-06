import { z } from "zod";
import type { Customer } from "@/features/customers/types";
import type { OrderRow } from "@/features/orders/types";

/** Riwayat pesanan milik customer yang sedang login (read-only). */
export type MyOrder = Pick<
    OrderRow,
    | "id"
    | "branchId"
    | "branchName"
    | "orderNumber"
    | "status"
    | "totalAmount"
    | "createdAt"
> & {
    hasReview: boolean;
};

export type MyOrdersPage = {
    rows: MyOrder[];
    nextPage: number | null;
    total: number;
    completedTotal: number;
};

/** Profil loyalty milik customer yang sedang login. */
export type MyLoyalty = Pick<
    Customer,
    "id" | "fullName" | "phone" | "segment" | "loyaltyPoints" | "loyaltyTier"
> & {
    orderCount: number;
};

export const createMyReviewSchema = z.object({
    orderId: z.string().min(1),
    rating: z.coerce.number().int().min(1).max(5),
    comment: z.string().max(500).optional().or(z.literal("")),
});

export type CreateMyReviewInput = z.infer<typeof createMyReviewSchema>;

export const updateMyPhoneSchema = z.object({
    phone: z
        .string()
        .min(5, "Masukkan Nomor yang valid")
        .max(15, "Nomor maximal 15 char"),
});

export type UpdateMyPhoneInput = z.infer<typeof updateMyPhoneSchema>;
