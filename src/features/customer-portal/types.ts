import type { OrderRow } from "@/features/orders/types";
import type { Customer } from "@/features/customers/types";

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
>;

/** Profil loyalty milik customer yang sedang login. */
export type MyLoyalty = Pick<
    Customer,
    "id" | "fullName" | "segment" | "loyaltyPoints" | "loyaltyTier"
> & {
    orderCount: number;
};
