import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { userKeys } from "@/features/query-keys";
import type {
    ChangeRoleFormValues,
    PasswordFormValues,
    ProfileFormValues,
} from "@/features/settings/types";
import { changePassword } from "@/lib/auth-client";
import { api, toEnvelope } from "@/lib/eden";

/**
 * Memperbarui profil user (nama).
 */
export const updateProfile = async (input: ProfileFormValues) => {
    const { data, error } = await api.settings.profile.post({
        name: input.name,
    });
    return toEnvelope(data, error);
};

/**
 * Mengganti password user via Better Auth client.
 * Tidak perlu server function — changePassword handle session cookie secara otomatis.
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
 */
export const changeUserRole = async (input: ChangeRoleFormValues) => {
    const { data, error } = await api.settings
        .users({ id: input.userId })
        .role.post({ userId: input.userId, role: input.role });
    return toEnvelope(data, error);
};

/**
 * Mengupload avatar user ke Cloudinary dan update kolom image di DB.
 */
export const uploadAvatar = async (input: { base64: string }) => {
    const { data, error } = await api.settings.avatar.post({
        base64: input.base64,
    });
    return toEnvelope(data, error);
};

/**
 * Menghapus avatar user (set image = null di DB).
 */
export const removeAvatar = async () => {
    const { data, error } = await api.settings.avatar.delete();
    return toEnvelope(data, error);
};

export const useUploadAvatar = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (values: { base64: string }) => uploadAvatar(values),
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

export const useRemoveAvatar = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => removeAvatar(),
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
        mutationFn: (values: ProfileFormValues) => updateProfile(values),
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
        mutationFn: (values: ChangeRoleFormValues) => changeUserRole(values),
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
