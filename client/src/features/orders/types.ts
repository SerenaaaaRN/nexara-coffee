import { z } from "zod";
import type { api, GetData } from "@/lib/eden";
import { ORDER_STATUSES, type OrderStatus } from "./data";

/**
 * Baris order — from eden treaty (source of truth: server).
 * Termasuk `branchName`, `customerName`, `createdByName` flat hasil join.
 */
export type OrderRow = GetData<typeof api.orders.get>["rows"][number];

/** Ringkasan count per status — from eden treaty. */
export type OrderSummary = GetData<typeof api.orders.get>["summary"];

/** Detail order + items — from eden treaty. */
export type OrderDetail = GetData<ReturnType<typeof api.orders>["get"]>;

export type Order = Omit<
    OrderRow,
    "branchName" | "customerName" | "createdByName"
>;

export type OrderItem = OrderDetail["items"][number];

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
