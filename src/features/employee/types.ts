import { z } from "zod";

export interface Employee {
    id: string;
    userId: string;
    branchId: string;
    baseSalary: string;
    hireDate: string;
    createdAt: string;
}

export interface EmployeeRow extends Employee {
    user: { id: string; name: string; email: string; role: string };
    branch: { id: string; name: string };
}

export type EmployeeJoined = {
    id: string;
    user_id: string;
    branch_id: string;
    base_salary: string;
    hire_date: string;
    created_at: string;
    user: { id: string; name: string; email: string; role: string } | null;
    branches: { id: string; name: string } | null;
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
