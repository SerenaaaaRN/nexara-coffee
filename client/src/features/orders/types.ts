import type {
    BranchRow as DBBranch,
    CustomerRow as DBCustomer,
    MenuItemRow as DBMenuItem,
    OrderRow as DBOrder,
    OrderItemRow as DBOrderItem,
    UserRow as DBUser,
} from "@database/types";
import { z } from "zod";
import type { ToCamelCase } from "@/utils/convert-types";
import { ORDER_STATUSES, type OrderStatus } from "./data";

export type Order = ToCamelCase<DBOrder>;

export type OrderItem = ToCamelCase<DBOrderItem>;

export type OrderRow = Order & {
    branchName: string | null;
    customerName: string | null;
    createdByName: string | null;
};

export type OrderDetail = Order & {
    branchName: string | null;
    customerName: string | null;
    createdByName: string | null;
    items: (OrderItem & { menuItemName?: string | null })[];
};

export type OrderJoined = DBOrder & {
    branches: Pick<DBBranch, "id" | "name"> | null;
    customers: Pick<DBCustomer, "id" | "full_name"> | null;
    created_by_user: Pick<DBUser, "id" | "name"> | null;
};

export type OrderItemJoined = DBOrderItem & {
    menu_items: Pick<DBMenuItem, "id" | "name"> | null;
};

export const createOrderSchema = z.object({
    branchId: z.string().min(1, "Branch is required"),
    customerId: z.string().optional(),
    items: z
        .array(
            z.object({
                menuItemId: z.string().min(1),
                name: z.string().min(1),
                price: z.coerce.number().positive(),
                variant: z.string().optional(),
                qty: z.coerce.number().int().positive(),
            }),
        )
        .min(1, "At least one item is required"),
});

export const updateStatusSchema = z.object({
    orderId: z.string().min(1),
    status: z.enum(ORDER_STATUSES),
});

export const cancelOrderSchema = z.object({
    orderId: z.string().min(1),
    reason: z.string().max(500).optional(),
});

export type { OrderStatus };
