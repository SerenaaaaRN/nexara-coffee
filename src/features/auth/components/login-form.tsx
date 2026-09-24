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
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
    FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { type LoginInput, loginSchema } from "@/features/auth/types";
import { signIn } from "@/lib/auth-client";
import { getDefaultRouteForRole, type Role } from "@/lib/rbac";

export function LoginForm() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [pending, setPending] = useState(false);
    const {
        register,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
    });

    async function onSubmit(values: LoginInput) {
        setPending(true);
        const { data, error: err } = await signIn.email({
            email: values.email,
            password: values.password,
        });
        if (err) {
            setError("root", { message: err.message ?? "Gagal masuk" });
            setPending(false);
            return;
        }
        toast.success(`Selamat datang kembali, ${data.user.name}!`);
        navigate({
            to: getDefaultRouteForRole((data.user as { role: Role }).role),
        });
    }

    return (
        <div className="flex flex-col gap-6">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-6">
                <FieldGroup>
                    <div className="flex flex-col items-center gap-1 text-center">
                        <h1 className="text-2xl font-bold">
                            Login to your account
                        </h1>
                        <p className="text-sm text-balance text-muted-foreground">
                            Enter your email below to login to your account
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
                            <FieldError errors={[errors.email]} />
                        </FieldContent>
                    </Field>
                    <Field data-invalid={!!errors.password}>
                        <div className="flex items-center">
                            <FieldLabel htmlFor="password">Password</FieldLabel>
                            <Link
                                to="/forgot-password"
                                className="ml-auto text-sm underline-offset-4 hover:underline">
                                Forgot your password?
                            </Link>
                        </div>
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
                    <Field>
                        <Button
                            type="submit"
                            disabled={pending}
                            className="w-full">
                            {pending ? "Memproses..." : "Login"}
                        </Button>
                    </Field>
                    {errors.root ? (
                        <p className="text-sm text-destructive text-center">
                            {errors.root.message}
                        </p>
                    ) : null}
                    <FieldSeparator>Or continue with</FieldSeparator>
                    <Field>
                        <Button
                            variant="outline"
                            type="button"
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
                            Login with Google
                        </Button>
                    </Field>
                    <Field>
                        <FieldDescription className="text-center">
                            Don&apos;t have an account?{" "}
                            <Link
                                to="/register"
                                className="underline underline-offset-4">
                                Sign up
                            </Link>
                        </FieldDescription>
                    </Field>
                </FieldGroup>
            </form>
        </div>
    );
}
