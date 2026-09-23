import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Field,
    FieldContent,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { type RegisterInput, registerSchema } from "@/features/auth/types";
import { signIn, signOut, signUp } from "@/lib/auth-client";

export function RegisterForm() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [pending, setPending] = useState(false);
    const {
        register,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm<RegisterInput>({
        resolver: zodResolver(registerSchema),
    });

    async function onSubmit(values: RegisterInput) {
        setPending(true);
        const { data, error: err } = await signUp.email({
            name: values.name,
            email: values.email,
            password: values.password,
        });
        if (err) {
            setError("root", { message: err.message ?? "Gagal daftar" });
            setPending(false);
            return;
        }
        await signOut();
        toast.success(`Akun ${data.user.name} berhasil dibuat, silakan login`);
        navigate({ to: "/login" });
    }

    return (
        <div className="flex flex-col gap-6">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-6">
                <FieldGroup>
                    <div className="flex flex-col items-center gap-1 text-center">
                        <h1 className="text-2xl font-bold">
                            Create your account
                        </h1>
                        <p className="text-sm text-balance text-muted-foreground">
                            Sign up to get started
                        </p>
                    </div>
                    <Field data-invalid={!!errors.name}>
                        <FieldLabel htmlFor="name">Full Name</FieldLabel>
                        <FieldContent>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Enter your name"
                                aria-invalid={!!errors.name}
                                {...register("name")}
                            />
                            <FieldError errors={[errors.name]} />
                        </FieldContent>
                    </Field>
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
                            <FieldError errors={[errors.email]} />
                        </FieldContent>
                    </Field>
                    <Field data-invalid={!!errors.password}>
                        <FieldLabel htmlFor="password">Password</FieldLabel>
                        <FieldContent>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
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
                        </FieldContent>
                    </Field>
                    <Field>
                        <Button
                            type="submit"
                            disabled={pending}
                            className="w-full">
                            {pending ? "Creating Account..." : "Create Account"}
                        </Button>
                    </Field>
                    {errors.root && (
                        <p className="text-sm text-destructive text-center">
                            {errors.root.message}
                        </p>
                    )}
                </FieldGroup>
            </form>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                    </span>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                <Button
                    variant="outline"
                    type="button"
                    className="w-full"
                    onClick={() =>
                        signIn.social({
                            provider: "google",
                            callbackURL: "/overview",
                        })
                    }>
                    <img
                        src="/icons/google.svg"
                        alt="google"
                        width={15}
                        height={15}
                    />
                    Sign up with Google
                </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="underline underline-offset-4">
                    Sign in
                </Link>
            </p>
        </div>
    );
}
