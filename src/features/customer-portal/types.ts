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

/** Profil loyalty milik customer yang sedang login. */
export type MyLoyalty = Pick<
    Customer,
    "id" | "fullName" | "segment" | "loyaltyPoints" | "loyaltyTier"
> & {
    orderCount: number;
};
