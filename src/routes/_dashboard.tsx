import {
    createFileRoute,
    Link,
    Outlet,
    redirect,
} from "@tanstack/react-router";
import { Home } from "lucide-react";
import { DashboardSkeleton } from "@/components/fallbacks/dashboard";
import { ErrorPage, NotFoundPage } from "@/components/fallbacks/error-page";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { BranchSwitcher } from "@/components/shared/branch-switcher";
import { DynamicBreadcrumb } from "@/components/shared/dynamic-breadcrumb";
import { ThemeSheet } from "@/components/shared/theme-sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { getSessionFn, loadDashboardFn } from "@/lib/auth-utils";

export const Route = createFileRoute("/_dashboard")({
    beforeLoad: async () => {
        const session = await getSessionFn();
        if (!session) throw redirect({ to: "/login" });
        return { session };
    },
    loader: async () => {
        return loadDashboardFn();
    },
    component: DashboardLayout,
    pendingMs: 0,
    pendingComponent: DashboardSkeleton,
    errorComponent: ({ error }) => (
        <ErrorPage error={error}>
            <Button
                variant="ghost"
                render={
                    <Link to="/overview">
                        <Home />
                        Home
                    </Link>
                }
            />
        </ErrorPage>
    ),
    notFoundComponent: () => <NotFoundPage to="/overview" />,
});

function HeaderBranchSwitcher() {
    const { isSuperAdmin, branchList, defaultBranchId } = Route.useLoaderData();

    return (
        <BranchSwitcher
            branches={branchList}
            isSuperAdmin={isSuperAdmin}
            defaultBranchId={defaultBranchId}
        />
    );
}

function HeaderLayout() {
    return (
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex w-full items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" />
                <DynamicBreadcrumb />
                <div className="ml-auto flex items-center gap-1">
                    <ThemeSheet />
                    <HeaderBranchSwitcher />
                </div>
            </div>
        </header>
    );
}

function DashboardLayout() {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="h-svh overflow-hidden">
                <HeaderLayout />
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0 min-h-0 overflow-y-auto">
                    <Outlet />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
