import { getRouteApi, Link } from "@tanstack/react-router";
import { Bell, LayoutDashboard } from "lucide-react";
import { Suspense } from "react";
import { BranchSwitcher } from "@/components/shared/branch-switcher";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
    useMenuCategories,
    useMenuItems,
} from "@/features/menu/hooks/useMenuQueries";
import { POSClient } from "@/features/pos/components/pos-client";
import { TourLauncher } from "@/features/tour/components/tour-launcher";

const routeApi = getRouteApi("/pos");

function POSBranchSwitcher() {
    const { dashboardData } = routeApi.useLoaderData();
    if (!dashboardData) return null;
    return (
        <BranchSwitcher
            branches={dashboardData.branchList}
            isSuperAdmin={dashboardData.isSuperAdmin}
            defaultBranchId={dashboardData.defaultBranchId}
        />
    );
}

export function POSPage() {
    const { session } = routeApi.useRouteContext();
    const { branch } = routeApi.useSearch();
    const { dashboardData } = routeApi.useLoaderData();
    const { data: categoriesRes } = useMenuCategories();
    const { data: itemsRes } = useMenuItems();

    const categories = categoriesRes.success ? categoriesRes.data : [];
    const items = itemsRes?.success ? itemsRes.data : [];
    const activeBranchId =
        branch ?? dashboardData?.defaultBranchId ?? undefined;

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-background">
            <header className="flex h-14 shrink-0 items-center justify-between border-b px-4 md:px-6">
                <div className="flex items-center gap-4">
                    <div className="font-semibold tracking-tight">
                        Nexara POS
                    </div>
                    <Separator orientation="vertical" className="h-6" />
                    <div className="hidden text-sm text-muted-foreground md:block">
                        {session.user.name}
                    </div>
                    <div className="ml-4 flex items-center">
                        <Suspense fallback={<Skeleton className="h-9 w-48" />}>
                            <POSBranchSwitcher />
                        </Suspense>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <TourLauncher />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative"
                        render={
                            <Link to="/notifications">
                                <Bell className="size-4" />
                            </Link>
                        }
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        className="hidden sm:flex"
                        render={
                            <Link to="/orders">
                                <LayoutDashboard className="mr-2 size-4" />
                                Dashboard
                            </Link>
                        }
                    />
                    <Button
                        variant="outline"
                        size="icon"
                        className="sm:hidden"
                        render={
                            <Link to="/orders">
                                <LayoutDashboard className="size-4" />
                            </Link>
                        }
                    />
                </div>
            </header>
            <main className="flex-1 overflow-hidden">
                <Suspense fallback={null}>
                    <POSClient
                        branchId={activeBranchId}
                        categories={categories}
                        items={items}
                    />
                </Suspense>
            </main>
        </div>
    );
}
