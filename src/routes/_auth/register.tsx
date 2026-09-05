import { createFileRoute, redirect } from "@tanstack/react-router";
import { RegisterForm } from "@/features/auth/components/register-form";
import { getSessionFn } from "@/lib/auth-utils";

export const Route = createFileRoute("/_auth/register")({
    beforeLoad: async () => {
        const session = await getSessionFn();
        if (session) throw redirect({ to: "/overview" });
    },
    component: RegisterForm,
});
