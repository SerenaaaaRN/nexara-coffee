import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
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
    type ForgotPasswordInput,
    forgotPasswordSchema,
} from "@/features/auth/types";
import { requestPasswordReset } from "@/lib/auth-client";

export function ForgotPasswordForm() {
    const [sent, setSent] = useState(false);
    const [pending, setPending] = useState(false);
    const {
        register,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm<ForgotPasswordInput>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    async function onSubmit(values: ForgotPasswordInput) {
        setPending(true);
        const { error: err } = await requestPasswordReset({
            email: values.email,
            redirectTo: `${window.location.origin}/reset-password`,
        });
        if (err) {
            setError("root", {
                message: err.message ?? "Gagal mengirim email reset",
            });
            setPending(false);
            return;
        }
        setSent(true);
        setPending(false);
    }

    if (sent) {
        return (
            <div className="flex flex-col gap-6">
                <FieldGroup>
                    <div className="flex flex-col items-center gap-1 text-center">
                        <h1 className="text-2xl font-bold">Check your email</h1>
                        <p className="text-sm text-balance text-muted-foreground">
                            If an account exists with that email, we've sent a
                            password reset link.
                        </p>
                    </div>
                    <Link
                        to="/login"
                        className="text-sm text-center text-muted-foreground underline underline-offset-4 hover:text-foreground">
                        <ArrowLeft className="inline size-3 mr-1" />
                        Back to login
                    </Link>
                </FieldGroup>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-6">
                <FieldGroup>
                    <div className="flex flex-col items-center gap-1 text-center">
                        <h1 className="text-2xl font-bold">Forgot password?</h1>
                        <p className="text-sm text-balance text-muted-foreground">
                            Enter your email and we'll send you a reset link.
                        </p>
                    </div>
                    <Field data-invalid={!!errors.email}>
                        <FieldLabel htmlFor="email">Email</FieldLabel>
                        <FieldContent>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                aria-invalid={!!errors.email}
                                {...register("email")}
                            />
                            <FieldDescription>
                                We'll send a password reset link to this email
                            </FieldDescription>
                            <FieldError errors={[errors.email]} />
                        </FieldContent>
                    </Field>
                    <Field>
                        <Button
                            type="submit"
                            disabled={pending}
                            className="w-full">
                            {pending ? "Sending..." : "Send Reset Link"}
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
