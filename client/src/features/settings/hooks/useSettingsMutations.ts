import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { z } from "zod";
import { userKeys } from "@/features/query-keys";
import type {
    ChangeRoleFormValues,
    PasswordFormValues,
    ProfileFormValues,
} from "@/features/settings/types";
import { changeRoleSchema, profileSchema } from "@/features/settings/types";
import { changePassword } from "@/lib/auth-client";

/**
 * Memperbarui profil user (nama + avatar).
 *
 * @param data.name - Nama baru user
 * @param data.image - URL avatar baru (nullable)
 * @returns User yang sudah diupdate
 */
export const updateProfileFn = createServerFn({ method: "POST" })
    .validator(profileSchema)
    .handler(async ({ data }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("update", "users");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { rateLimit } = await import("@/lib/rate-limit");
        const ip = auth.session.user.id;
        const allowed = rateLimit(`settings-profile:${ip}`, 20, 60_000);
        if (!allowed)
            return { success: false as const, error: "Too many requests" };

        const { supabaseAdmin } = await import("@database/server");

        const { data: updated, error } = await supabaseAdmin
            .from("user")
            .update({ name: data.name })
            .eq("id", auth.session.user.id)
            .select()
            .single();

        if (error || !updated)
            return {
                success: false as const,
                error: error?.message ?? "User tidak ditemukan",
            };

        return {
            success: true as const,
            data: {
                id: updated.id,
                name: updated.name,
                email: updated.email,
                role: updated.role,
                image: updated.image,
            },
        };
    });

/**
 * Mengganti password user via Better Auth client.
 * Tidak perlu server function — changePassword handle session cookie secara otomatis.
 *
 * @param data.currentPassword - Password saat ini
 * @param data.newPassword - Password baru
 */
export const useChangePassword = () => {
    return useMutation({
        mutationFn: async (values: PasswordFormValues) => {
            const { error } = await changePassword({
                currentPassword: values.currentPassword,
                newPassword: values.newPassword,
            });
            if (error) {
                return {
                    success: false as const,
                    error: error.message || "Failed to change password",
                };
            }
            return { success: true as const, data: null as never };
        },
        onSuccess: (res) => {
            if (res.success) {
                toast.success("Password changed");
            } else {
                toast.error(res.error);
            }
        },
        onError: (err) => {
            toast.error(
                err instanceof Error
                    ? err.message
                    : "Failed to change password",
            );
        },
    });
};

/**
 * Mengganti role user lain.
 * Hanya super_admin / branch_manager yang bisa.
 * Hanya bisa assign role dengan level di bawah role sendiri.
 *
 * @param data.userId - ID user yang akan diubah rolenya
 * @param data.role - Role baru
 * @returns User yang sudah diupdate
 */
export const changeUserRoleFn = createServerFn({ method: "POST" })
    .validator(changeRoleSchema)
    .handler(async ({ data }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("manage", "users");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        if (
            auth.session.user.role === "branch_manager" &&
            !["cashier", "barista"].includes(data.role)
        ) {
            return {
                success: false as const,
                error: "Branch managers can only assign cashier or barista roles",
            };
        }

        const { rateLimit } = await import("@/lib/rate-limit");
        const ip = auth.session.user.id;
        const allowed = rateLimit(`settings-role:${ip}`, 10, 60_000);
        if (!allowed)
            return { success: false as const, error: "Too many requests" };

        const { supabaseAdmin } = await import("@database/server");
        const { logAudit } = await import("@/lib/audit-log");

        const { data: targetUser, error: targetError } = await supabaseAdmin
            .from("user")
            .select("id, role")
            .eq("id", data.userId)
            .maybeSingle();

        if (targetError || !targetUser)
            return {
                success: false as const,
                error: targetError?.message ?? "User not found",
            };

        const myLevel =
            {
                super_admin: 0,
                branch_manager: 1,
                franchise_owner: 2,
                cashier: 3,
                barista: 4,
                visitor: 5,
            }[auth.session.user.role] ?? 999;

        const targetLevel =
            {
                super_admin: 0,
                branch_manager: 1,
                franchise_owner: 2,
                cashier: 3,
                barista: 4,
                visitor: 5,
            }[targetUser.role] ?? 999;

        if (targetLevel <= myLevel) {
            return {
                success: false as const,
                error: "You cannot change the role of users with the same or higher level",
            };
        }

        const { data: updated, error } = await supabaseAdmin
            .from("user")
            .update({ role: data.role })
            .eq("id", data.userId)
            .select()
            .single();

        if (error || !updated)
            return {
                success: false as const,
                error: error?.message ?? "User tidak ditemukan",
            };

        void logAudit({
            actorId: auth.session.user.id,
            action: "update",
            targetTable: "users",
            targetId: data.userId,
            metadata: {
                fromRole: targetUser.role,
                toRole: data.role,
            },
        });

        return {
            success: true as const,
            data: {
                id: updated.id,
                name: updated.name,
                email: updated.email,
                role: updated.role,
                image: updated.image,
            },
        };
    });

/**
 * Mengupload avatar user ke Cloudinary dan update kolom image di DB.
 *
 * @param data.base64 - String base64 dari file gambar
 * @returns URL avatar yang sudah diupload
 */
export const uploadAvatarFn = createServerFn({ method: "POST" })
    .validator(
        z.object({ base64: z.string().min(1, "Gambar tidak boleh kosong") }),
    )
    .handler(async ({ data }) => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("update", "users");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { rateLimit } = await import("@/lib/rate-limit");
        const ip = auth.session.user.id;
        const allowed = rateLimit(`settings-avatar:${ip}`, 5, 60_000);
        if (!allowed)
            return { success: false as const, error: "Too many requests" };

        const { uploadImageBase64 } = await import("@/lib/cloudinary");
        const { supabaseAdmin } = await import("@database/server");

        const result = await uploadImageBase64(data.base64, "nexara/avatars");
        if (!result) {
            return { success: false as const, error: "Gagal upload gambar" };
        }

        const { error } = await supabaseAdmin
            .from("user")
            .update({ image: result.url })
            .eq("id", auth.session.user.id);

        if (error) return { success: false as const, error: error.message };

        return { success: true as const, data: { url: result.url } };
    });

export const useUploadAvatar = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (values: { base64: string }) =>
            uploadAvatarFn({ data: values }),
        onSuccess: (res) => {
            if (res.success) {
                toast.success("Avatar updated");
                queryClient.invalidateQueries({ queryKey: userKeys.all });
            } else {
                toast.error(res.error);
            }
        },
    });
};

/**
 * Menghapus avatar user (set image = null di DB).
 */
export const removeAvatarFn = createServerFn({ method: "POST" }).handler(
    async () => {
        const { requireAccessAction } = await import("@/lib/with-auth.server");
        const auth = await requireAccessAction("update", "users");
        if (!auth.success)
            return { success: false as const, error: auth.error };

        const { rateLimit } = await import("@/lib/rate-limit");
        const ip = auth.session.user.id;
        const allowed = rateLimit(`settings-avatar:${ip}`, 5, 60_000);
        if (!allowed)
            return { success: false as const, error: "Too many requests" };

        const { supabaseAdmin } = await import("@database/server");

        const { error } = await supabaseAdmin
            .from("user")
            .update({ image: null })
            .eq("id", auth.session.user.id);

        if (error) return { success: false as const, error: error.message };

        return { success: true as const, data: null as never };
    },
);

export const useRemoveAvatar = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => removeAvatarFn(),
        onSuccess: (res) => {
            if (res.success) {
                toast.success("Avatar removed");
                queryClient.invalidateQueries({ queryKey: userKeys.all });
            } else {
                toast.error(res.error);
            }
        },
    });
};

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (values: ProfileFormValues) =>
            updateProfileFn({ data: values }),
        onSuccess: (res) => {
            if (res.success) {
                toast.success("Profile updated");
                queryClient.invalidateQueries({ queryKey: userKeys.all });
            } else {
                toast.error(res.error);
            }
        },
    });
};

export const useChangeUserRole = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (values: ChangeRoleFormValues) =>
            changeUserRoleFn({ data: values }),
        onSuccess: (res) => {
            if (res.success) {
                toast.success("Role updated");
                queryClient.invalidateQueries({ queryKey: userKeys.all });
            } else {
                toast.error(res.error);
            }
        },
    });
};
