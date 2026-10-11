import { createFileRoute, redirect } from "@tanstack/react-router";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import { getSession } from "@/lib/session";

export const Route = createFileRoute("/_auth/forgot-password")({
    beforeLoad: async () => {
        const session = await getSession();
        if (session) throw redirect({ to: "/overview" });
    },
    component: ForgotPasswordForm,
});
