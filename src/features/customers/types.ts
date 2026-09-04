import { z } from "zod";

export const CUSTOMER_SEGMENTS = ["regular", "vip", "new"] as const;
export type CustomerSegment = (typeof CUSTOMER_SEGMENTS)[number];

export const LOYALTY_TIERS = ["bronze", "silver", "gold", "platinum"] as const;
export type LoyaltyTier = (typeof LOYALTY_TIERS)[number];

export interface Customer {
    id: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    segment: string;
    loyaltyPoints: number;
    loyaltyTier: string;
    createdAt: string;
}

export interface CustomerRow extends Customer {
    orderCount: number;
}

export const createCustomerSchema = z.object({
    fullName: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
    segment: z.enum(CUSTOMER_SEGMENTS),
    loyaltyPoints: z.number().int().min(0).default(0),
    loyaltyTier: z.enum(LOYALTY_TIERS),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const updateLoyaltySchema = z.object({
    points: z.coerce.number().int().min(0),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
