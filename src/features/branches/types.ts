import { z } from "zod";

export interface Branch {
    id: string;
    name: string;
    address: string;
    lat: string | null;
    lng: string | null;
    phone: string | null;
    openingTime: string | null;
    closingTime: string | null;
    status: string;
    ownershipType: string;
    managerId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface BranchRow extends Branch {
    manager: { id: string; name: string; email: string } | null;
    employeeCount: number;
}

export type BranchJoined = {
    id: string;
    name: string;
    address: string;
    lat: string | null;
    lng: string | null;
    phone: string | null;
    opening_time: string | null;
    closing_time: string | null;
    status: string;
    ownership_type: string;
    manager_id: string | null;
    created_at: string;
    updated_at: string;
    manager: { id: string; name: string; email: string } | null;
};

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
