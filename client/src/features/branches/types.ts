import { z } from "zod";
import type { api, GetData } from "@/lib/eden";

/**
 * Entity cabang — sumber kebenaran dari backend (Eden treaty).
 * Tidak lagi diturunkan dari `@database/types`.
 */
export type Branch = GetData<typeof api.branches.post>;
export type BranchRow = GetData<typeof api.branches.get>[number];
export type FranchiseAssignment = GetData<typeof api.branches.franchise.post>;

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const createBranchSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(30),
    address: z
        .string()
        .min(5, "Address must be at least 5 characters")
        .max(150, "Address max 100 char"),
    lat: z.string().optional(),
    lng: z.string().optional(),
    phone: z.string().optional(),
    openingTime: z
        .string()
        .regex(timeRegex, "Use 24-hour format (HH:mm)")
        .or(z.literal(""))
        .optional(),
    closingTime: z
        .string()
        .regex(timeRegex, "Use 24-hour format (HH:mm)")
        .or(z.literal(""))
        .optional(),
    ownershipType: z.enum(["corporate", "franchise"]),
});

export const updateBranchSchema = createBranchSchema.partial();

export const assignFranchiseSchema = z.object({
    branchId: z.string().min(1),
    userId: z.string().min(1),
    commissionRate: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid rate"),
});

export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;
export type AssignFranchiseInput = z.infer<typeof assignFranchiseSchema>;
