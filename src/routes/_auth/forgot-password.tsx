import { createFileRoute, redirect } from "@tanstack/react-router";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import { getSessionFn } from "@/lib/auth-utils";

export const Route = createFileRoute("/_auth/forgot-password")({
    beforeLoad: async () => {
        const session = await getSessionFn();
        if (session) throw redirect({ to: "/overview" });
    },
    component: ForgotPasswordForm,
});
