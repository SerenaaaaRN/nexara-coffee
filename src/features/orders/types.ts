import { z } from "zod";
import { ORDER_STATUSES, type OrderStatus } from "./data";

export interface Order {
    id: string;
    branchId: string;
    customerId: string | null;
    orderNumber: string;
    status: string;
    totalAmount: string;
    createdBy: string | null;
    createdAt: string;
}

export interface OrderItem {
    id: string;
    orderId: string;
    menuItemId: string | null;
    nameSnapshot: string;
    priceSnapshot: string;
    variantSnapshot: string | null;
    qty: number;
    subtotal: string;
}

export interface OrderRow extends Order {
    branchName: string | null;
    customerName: string | null;
    createdByName: string | null;
}

export interface OrderDetail extends Order {
    branchName: string | null;
    customerName: string | null;
    createdByName: string | null;
    items: (OrderItem & { menuItemName?: string | null })[];
}

export interface OrderJoined {
    id: string;
    branch_id: string;
    customer_id: string | null;
    order_number: string;
    status: string;
    total_amount: string;
    created_by: string | null;
    created_at: string;
    branches: { id: string; name: string } | null;
    customers: { id: string; full_name: string } | null;
    created_by_user: { id: string; name: string } | null;
}

export interface OrderItemJoined {
    id: string;
    order_id: string;
    menu_item_id: string | null;
    name_snapshot: string;
    price_snapshot: string;
    variant_snapshot: string | null;
    qty: number;
    subtotal: string;
    menu_items: { id: string; name: string } | null;
}

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
