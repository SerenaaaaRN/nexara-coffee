import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
    Field,
    FieldContent,
    FieldError,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useChangePassword } from "@/features/settings/hooks/useSettingsMutations";
import type { PasswordFormValues } from "@/features/settings/types";
import { passwordSchema } from "@/features/settings/types";

export const AccountFormSection = () => {
    const changePassword = useChangePassword();
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const form = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    const onSubmit = async (data: PasswordFormValues) => {
        const res = await changePassword.mutateAsync(data);
        if (res.success) {
            form.reset();
        }
    };

    return (
        <form
            data-tour="settings-password"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6">
            <Controller
                name="currentPassword"
                control={form.control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={Boolean(fieldState.error)}>
                        <FieldLabel>Current Password</FieldLabel>
                        <FieldContent>
                            <div className="relative">
                                <Input
                                    {...field}
                                    type={
                                        showCurrentPassword
                                            ? "text"
                                            : "password"
                                    }
                                    placeholder="Enter current password"
                                    disabled={changePassword.isPending}
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowCurrentPassword((prev) => !prev)
                                    }
                                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                                    {showCurrentPassword ? (
                                        <EyeOff size={16} />
                                    ) : (
                                        <Eye size={16} />
                                    )}
                                </button>
                            </div>
                        </FieldContent>
                        {fieldState.error ? (
                            <FieldError>{fieldState.error.message}</FieldError>
                        ) : null}
                    </Field>
                )}
            />

            <Controller
                name="newPassword"
                control={form.control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={Boolean(fieldState.error)}>
                        <FieldLabel>New Password</FieldLabel>
                        <FieldContent>
                            <div className="relative">
                                <Input
                                    {...field}
                                    type={showNewPassword ? "text" : "password"}
                                    placeholder="Enter new password"
                                    disabled={changePassword.isPending}
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowNewPassword((prev) => !prev)
                                    }
                                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                                    {showNewPassword ? (
                                        <EyeOff size={16} />
                                    ) : (
                                        <Eye size={16} />
                                    )}
                                </button>
                            </div>
                        </FieldContent>
                        {fieldState.error ? (
                            <FieldError>{fieldState.error.message}</FieldError>
                        ) : null}
                    </Field>
                )}
            />

            <Controller
                name="confirmPassword"
                control={form.control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={Boolean(fieldState.error)}>
                        <FieldLabel>Confirm New Password</FieldLabel>
                        <FieldContent>
                            <div className="relative">
                                <Input
                                    {...field}
                                    type={
                                        showConfirmPassword
                                            ? "text"
                                            : "password"
                                    }
                                    placeholder="Confirm new password"
                                    disabled={changePassword.isPending}
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowConfirmPassword((prev) => !prev)
                                    }
                                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                                    {showConfirmPassword ? (
                                        <EyeOff size={16} />
                                    ) : (
                                        <Eye size={16} />
                                    )}
                                </button>
                            </div>
                        </FieldContent>
                        {fieldState.error ? (
                            <FieldError>{fieldState.error.message}</FieldError>
                        ) : null}
                    </Field>
                )}
            />

            <div className="flex justify-end">
                <Button type="submit" disabled={changePassword.isPending}>
                    {changePassword.isPending
                        ? "Updating Password..."
                        : "Update Password"}
                </Button>
            </div>
        </form>
    );
};
