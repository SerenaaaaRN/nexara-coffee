import { createFileRoute, redirect } from "@tanstack/react-router";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { getSession } from "@/lib/session";

export const Route = createFileRoute("/_auth/reset-password")({
    beforeLoad: async () => {
        const session = await getSession();
        if (session) throw redirect({ to: "/overview" });
    },
    validateSearch: (search: Record<string, string | undefined>) => ({
        token: search.token,
    }),
    component: ResetPasswordPage,
});

function ResetPasswordPage() {
    const { token } = Route.useSearch();

    if (!token) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center gap-1 text-center">
                    <h1 className="text-2xl font-bold">Invalid link</h1>
                    <p className="text-sm text-balance text-muted-foreground">
                        This reset link is invalid or expired.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center min-h-50 text-muted-foreground">
                    Loading...
                </div>
            }>
            <ResetPasswordForm token={token} />
        </Suspense>
    );
}
