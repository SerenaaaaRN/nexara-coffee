import { z } from "zod";

export interface Review {
    id: string;
    branchId: string;
    customerId: string | null;
    orderId: string | null;
    rating: number;
    comment: string | null;
    status: string;
    reply: string | null;
    createdAt: string;
}

export interface ReviewRow extends Review {
    branchName: string | null;
    customerName: string | null;
}

export interface ReviewJoined {
    id: string;
    branch_id: string;
    customer_id: string | null;
    order_id: string | null;
    rating: number;
    comment: string | null;
    status: string;
    reply: string | null;
    created_at: string;
    branches: { id: string; name: string } | null;
    customers: { id: string; full_name: string } | null;
}

export const replyReviewSchema = z.object({
    reply: z.string().max(1000).optional().or(z.literal("")),
});
