import type { BranchRow as DBBranch, UserRow as DBUser } from "@database/types";
import { z } from "zod";
import type { ToCamelCase } from "@/utils/convert-types";

export type Branch = ToCamelCase<DBBranch>;

export type BranchJoined = DBBranch & {
    manager: Pick<DBUser, "id" | "name" | "email"> | null;
};

export type BranchRow = Branch & {
    manager: Pick<DBUser, "id" | "name" | "email"> | null;
    employeeCount: number;
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
