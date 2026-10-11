import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
    type ResetPasswordInput,
    resetPasswordSchema,
} from "@/features/auth/types";
import { resetPassword } from "@/lib/auth-client";

interface ResetPasswordFormProps {
    token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [pending, setPending] = useState(false);
    const {
        register,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm<ResetPasswordInput>({
        resolver: zodResolver(resetPasswordSchema),
    });

    async function onSubmit(values: ResetPasswordInput) {
        setPending(true);
        const { error: err } = await resetPassword({
            newPassword: values.password,
            token,
        });
        if (err) {
            setError("root", {
                message: err.message ?? "Gagal mereset password",
            });
            setPending(false);
            return;
        }
        toast.success("Password berhasil direset, silakan login");
        navigate({ to: "/login" });
    }

    return (
        <div className="flex flex-col gap-6">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-6">
                <FieldGroup>
                    <div className="flex flex-col items-center gap-1 text-center">
                        <h1 className="text-2xl font-bold">Set new password</h1>
                        <p className="text-sm text-balance text-muted-foreground">
                            Must be at least 8 characters long.
                        </p>
                    </div>
                    <Field data-invalid={!!errors.password}>
                        <FieldLabel htmlFor="password">New Password</FieldLabel>
                        <FieldContent>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="********"
                                    className="pr-8"
                                    aria-invalid={!!errors.password}
                                    {...register("password")}
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="absolute right-1 top-1/2 -translate-y-1/2 size-6 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer">
                                    {showPassword ? (
                                        <EyeOff className="size-4" />
                                    ) : (
                                        <Eye className="size-4" />
                                    )}
                                </button>
                            </div>
                            <FieldError errors={[errors.password]} />
                        </FieldContent>
                    </Field>
                    <Field data-invalid={!!errors.confirmPassword}>
                        <FieldLabel htmlFor="confirm-password">
                            Confirm Password
                        </FieldLabel>
                        <FieldContent>
                            <div className="relative">
                                <Input
                                    id="confirm-password"
                                    type={
                                        showConfirmPassword
                                            ? "text"
                                            : "password"
                                    }
                                    placeholder="********"
                                    className="pr-8"
                                    aria-invalid={!!errors.confirmPassword}
                                    {...register("confirmPassword")}
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowConfirmPassword(
                                            !showConfirmPassword,
                                        )
                                    }
                                    className="absolute right-1 top-1/2 -translate-y-1/2 size-6 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer">
                                    {showConfirmPassword ? (
                                        <EyeOff className="size-4" />
                                    ) : (
                                        <Eye className="size-4" />
                                    )}
                                </button>
                            </div>
                            <FieldError errors={[errors.confirmPassword]} />
                            <FieldDescription>
                                Enter the same password to confirm
                            </FieldDescription>
                        </FieldContent>
                    </Field>
                    <Field>
                        <Button
                            type="submit"
                            disabled={pending}
                            className="w-full">
                            {pending ? "Resetting..." : "Reset Password"}
                        </Button>
                    </Field>
                    {errors.root && (
                        <p className="text-sm text-destructive text-center">
                            {errors.root.message}
                        </p>
                    )}
                    <Link
                        to="/login"
                        className="text-sm text-center text-muted-foreground underline underline-offset-4 hover:text-foreground">
                        <ArrowLeft className="inline size-3 mr-1" />
                        Back to login
                    </Link>
                </FieldGroup>
            </form>
        </div>
    );
}
