import { z } from "zod";
import type { api, GetData } from "@/lib/eden";

export const CUSTOMER_SEGMENTS = ["regular", "vip", "new"] as const;
export type CustomerSegment = (typeof CUSTOMER_SEGMENTS)[number];

export const LOYALTY_TIERS = ["bronze", "silver", "gold", "platinum"] as const;
export type LoyaltyTier = (typeof LOYALTY_TIERS)[number];

/** Rp10.000 belanja = 1 poin loyalty. */
export const POINTS_PER_RP = 10_000;

/** Ambang poin naik tier (di bawah silver = bronze). */
export const TIER_THRESHOLDS = {
    silver: 100,
    gold: 500,
    platinum: 1000,
} as const;

/** Tier untuk jumlah poin tertentu. */
export function tierForPoints(points: number): LoyaltyTier {
    if (points >= TIER_THRESHOLDS.platinum) return "platinum";
    if (points >= TIER_THRESHOLDS.gold) return "gold";
    if (points >= TIER_THRESHOLDS.silver) return "silver";
    return "bronze";
}

/** Poin yang didapat dari nominal belanja (dibulatkan ke bawah). */
export function earnedPointsForTotal(total: number | string): number {
    return Math.floor(Number(total) / POINTS_PER_RP);
}

/** Normalisasi nomor HP: buang semua non-digit. */
export function normalizePhone(phone: string): string {
    return phone.replace(/\D/g, "");
}

/**
 * Entity customer — sumber kebenaran dari backend (Eden treaty).
 */
export type Customer = GetData<
    (typeof api.customers)["find-or-create"]["post"]
>;

export type CustomerRow = GetData<typeof api.customers.get>["rows"][number];

/** Ringkasan agregat customers — from eden treaty. */
export type CustomerSummary = GetData<typeof api.customers.get>["summary"];

/**
 * Hasil lookup member via HP (read-only, tanpa create) —
 * sumber kebenaran dari backend (Eden treaty).
 */
export type CustomerLookupResult = GetData<
    (typeof api.customers)["lookup"]["post"]
>;

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
