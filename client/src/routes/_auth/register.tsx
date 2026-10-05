import { createFileRoute, redirect } from "@tanstack/react-router";
import { RegisterForm } from "@/features/auth/components/register-form";
import { getSession } from "@/lib/session";
import { getDefaultRouteForRole, type Role } from "@/lib/rbac";

export const Route = createFileRoute("/_auth/register")({
    beforeLoad: async () => {
        const session = await getSession();
        if (session)
            throw redirect({
                to: getDefaultRouteForRole(session.user.role as Role),
            });
    },
    component: RegisterForm,
});
