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
    "id" | "fullName" | "segment" | "loyaltyPoints" | "loyaltyTier"
> & {
    orderCount: number;
};
