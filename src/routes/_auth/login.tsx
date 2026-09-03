import { createFileRoute, redirect } from "@tanstack/react-router";
import { LoginForm } from "@/features/auth/components/login-form";
import { getSessionFn } from "@/lib/auth-utils";

export const Route = createFileRoute("/_auth/login")({
    beforeLoad: async () => {
        const session = await getSessionFn();
        if (session) throw redirect({ to: "/" });
    },
    component: LoginForm,
});
