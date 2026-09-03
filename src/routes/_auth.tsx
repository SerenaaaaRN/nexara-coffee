import { createFileRoute, Outlet } from "@tanstack/react-router";
import { GalleryVerticalEnd } from "lucide-react";
import { AuthSkeleton } from "@/components/fallbacks/auth";
import { ErrorPage } from "@/components/fallbacks/error-page";

export const Route = createFileRoute("/_auth")({
    component: AuthLayout,
    pendingMs: 0,
    pendingComponent: AuthSkeleton,
    errorComponent: ({ error }) => <ErrorPage error={error} />,
});

function AuthLayout() {
    return (
        <main className="grid min-h-svh lg:grid-cols-2">
            <div className="flex flex-col gap-4 p-6 md:p-10">
                <div className="flex justify-center gap-2 md:justify-start">
                    <div className="flex items-center gap-2 font-medium">
                        <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                            <GalleryVerticalEnd className="size-4" />
                        </div>
                        Nexara Inc.
                    </div>
                </div>
                <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-xs">
                        <Outlet />
                    </div>
                </div>
            </div>
            <div className="relative hidden bg-linear-to-br from-primary/10 to-primary/5 lg:block">
                <img
                    src="/login.jpg"
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                />
            </div>
        </main>
    );
}
