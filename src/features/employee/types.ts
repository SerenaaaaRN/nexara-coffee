import type {
    BranchRow as DBBranch,
    EmployeeDetailsRow as DBEmployee,
    UserRow as DBUser,
} from "@database/types";
import { z } from "zod";
import type { ToCamelCase } from "@/utils/convert-types";

export type Employee = ToCamelCase<DBEmployee>;

export type EmployeeRow = Employee & {
    user: { id: string; name: string; email: string; role: string };
    branch: { id: string; name: string };
};

export type EmployeeJoined = DBEmployee & {
    user: Pick<DBUser, "id" | "name" | "email" | "role"> | null;
    branches: Pick<DBBranch, "id" | "name"> | null;
};

export const createEmployeeSchema = z.object({
    userId: z.string().min(1, "User is required"),
    branchId: z.string().min(1, "Branch is required"),
    baseSalary: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid salary"),
    hireDate: z.string().min(1, "Hire date is required"),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
