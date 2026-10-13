import { z } from "zod";
import type { api, GetData } from "@/lib/eden";

/**
 * Baris employee — from eden treaty (source of truth: server).
 * Join user/cabang berbentuk FLAT (`userName`, `userEmail`, `userRole`,
 * `branchName`), bukan nested object.
 */
export type EmployeeRow = GetData<typeof api.employees.get>["rows"][number];

/** Ringkasan agregat employees — from eden treaty. */
export type EmployeeSummary = GetData<typeof api.employees.get>["summary"];

export type Employee = Omit<
    EmployeeRow,
    "userName" | "userEmail" | "userRole" | "branchName"
>;

/** Calon user tanpa employee — from eden treaty. */
export type AvailableUser = GetData<
    (typeof api.employees)["available-users"]["get"]
>[number];

/** Opsi cabang untuk form employee — from eden treaty. */
export type EmployeeBranchOption = GetData<
    (typeof api.employees)["branches"]["get"]
>[number];

export const createEmployeeSchema = z.object({
    userId: z.string().min(1, "User is required"),
    branchId: z.string().min(1, "Branch is required"),
    baseSalary: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid salary"),
    hireDate: z.string().min(1, "Hire date is required"),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
