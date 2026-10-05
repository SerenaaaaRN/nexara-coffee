import { z } from "zod";
import type { api, GetData } from "@/lib/eden";

export const profileSchema = z.object({
    name: z.string().min(1, "Name is required"),
});

export const passwordSchema = z
    .object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(
                /^(?=.*[a-zA-Z])(?=.*\d)/,
                "Password must contain at least one letter and one number",
            ),
        confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export const changeRoleSchema = z.object({
    userId: z.string(),
    role: z.enum([
        "super_admin",
        "branch_manager",
        "franchise_owner",
        "cashier",
        "barista",
        "visitor",
    ]),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
export type PasswordFormValues = z.infer<typeof passwordSchema>;
export type ChangeRoleFormValues = z.infer<typeof changeRoleSchema>;

/** User untuk tabel settings — from eden treaty (source of truth: server). */
export type SettingsUser = GetData<typeof api.settings.users.get>[number];
