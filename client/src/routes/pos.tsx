import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { ErrorPage } from "@/components/fallbacks/error-page";
import { PosSkeleton } from "@/components/fallbacks/pos";
import { Button } from "@/components/ui/button";
import {
    menuCategoriesOptions,
    menuItemsOptions,
} from "@/features/menu/hooks/useMenuQueries";
import { POSPage } from "@/features/pos/components/pos-page";
import { getSession, loadDashboard } from "@/lib/session";
import { getDefaultRouteForRole, type Role } from "@/lib/rbac";

const posSearchSchema = z.object({
    branch: z.string().optional(),
    search: z.string().optional(),
    category: z.string().optional(),
});

export const Route = createFileRoute("/pos")({
    validateSearch: posSearchSchema,
    beforeLoad: async () => {
        const session = await getSession();
        if (!session) throw redirect({ to: "/login" });
        const role = session.user.role;
        if (
            role !== "super_admin" &&
            role !== "branch_manager" &&
            role !== "cashier"
        ) {
            throw redirect({
                to: getDefaultRouteForRole(role as Role),
            });
        }
        return { session };
    },
    loader: async ({ context: { queryClient } }) => {
        const [_, __, dashboardData] = await Promise.all([
            queryClient.ensureQueryData(menuCategoriesOptions()),
            queryClient.ensureQueryData(menuItemsOptions()),
            loadDashboard(),
        ]);
        return { dashboardData };
    },
    head: () => ({
        meta: [
            { title: "Point of Sale" },
            {
                name: "description",
                content: "Record customer orders and transactions.",
            },
        ],
    }),
    component: POSPage,
    pendingMs: 0,
    pendingComponent: PosSkeleton,
    errorComponent: ({ error }) => (
        <ErrorPage error={error}>
            <Button variant="ghost" onClick={() => window.history.back()}>
                Go back
            </Button>
        </ErrorPage>
    ),
});
